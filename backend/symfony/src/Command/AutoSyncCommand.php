<?php

namespace App\Command;

use App\Service\ImageSyncService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:auto-sync',
    description: 'Ejecuta sincronización automática en bucle continuo con polling'
)]
class AutoSyncCommand extends Command
{
    private ImageSyncService $imageSyncService;

    public function __construct(ImageSyncService $imageSyncService)
    {
        $this->imageSyncService = $imageSyncService;
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('interval', 'i', InputOption::VALUE_REQUIRED, 'Intervalo entre sincronizaciones en segundos', 300)
            ->addOption('max-iterations', 'm', InputOption::VALUE_REQUIRED, 'Número máximo de iteraciones (0 = infinito)', 0)
            ->addOption('detailed-logs', 'l', InputOption::VALUE_NONE, 'Mostrar logs detallados')
            ->addOption('daemon', 'd', InputOption::VALUE_NONE, 'Ejecutar como daemon (sin output interactivo)');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $interval = (int) $input->getOption('interval');
        $maxIterations = (int) $input->getOption('max-iterations');
        $verbose = $input->getOption('detailed-logs');
        $daemon = $input->getOption('daemon');

        if ($daemon) {
            $io->title('🔄 Iniciando daemon de sincronización automática');
        } else {
            $io->title('🔄 Sincronización automática con polling');
        }

        $io->text("⏱️  Intervalo: {$interval} segundos");
        $io->text("🔄 Iteraciones: " . ($maxIterations === 0 ? 'Infinitas' : $maxIterations));
        $io->text("📊 Logs detallados: " . ($verbose ? 'Sí' : 'No'));
        $io->text("👻 Daemon: " . ($daemon ? 'Sí' : 'No'));

        if (!$daemon) {
            $io->warning('Presiona Ctrl+C para detener el proceso');
            $io->newLine();
        }

        $iteration = 0;
        $startTime = time();

        while (true) {
            $iteration++;
            
            if ($maxIterations > 0 && $iteration > $maxIterations) {
                if (!$daemon) {
                    $io->success("Completadas {$maxIterations} iteraciones. Finalizando.");
                }
                break;
            }

            $currentTime = date('Y-m-d H:i:s');
            
            if (!$daemon) {
                $io->section("🔄 Iteración #$iteration - $currentTime");
            }

            try {
                // Ejecutar sincronización completa
                $results = $this->imageSyncService->runFullSync();
                
                $totalSynced = $results['temp_sync']['synced'];
                $totalUpdated = $results['cache_update']['updated'];
                $totalCleaned = $results['cache_cleanup']['cleaned'];
                $totalErrors = $results['temp_sync']['errors'] + $results['cache_update']['errors'] + $results['cache_cleanup']['errors'];

                if ($verbose || !$daemon) {
                    if (!$daemon) {
                        $io->text("📱 Temporales: $totalSynced sincronizadas");
                        $io->text("🔄 Cache: $totalUpdated actualizados");
                        $io->text("🧹 Limpieza: $totalCleaned eliminados");
                        $io->text("❌ Errores: $totalErrors");
                    }
                }

                // Log para daemon
                if ($daemon) {
                    error_log("AutoSync #$iteration: $totalSynced temp, $totalUpdated cache, $totalCleaned cleaned, $totalErrors errors");
                }

                // Mostrar estadísticas cada 10 iteraciones
                if ($iteration % 10 === 0) {
                    $stats = $this->imageSyncService->getCacheStats();
                    $uptime = time() - $startTime;
                    $uptimeFormatted = gmdate('H:i:s', $uptime);
                    
                    if (!$daemon) {
                        $io->section("📊 Estadísticas (Iteración #$iteration)");
                        $io->table(
                            ['Métrica', 'Valor'],
                            [
                                ['Tiempo activo', $uptimeFormatted],
                                ['Archivos temporales', $stats['temp_files']],
                                ['Archivos en cache', $stats['cache_files']],
                                ['Tamaño cache (MB)', $stats['cache_size_mb']],
                                ['Última sync', $stats['last_sync'] ?? 'Nunca'],
                            ]
                        );
                    }
                }

            } catch (\Exception $e) {
                $errorMsg = "Error en iteración #$iteration: " . $e->getMessage();
                
                if (!$daemon) {
                    $io->error($errorMsg);
                } else {
                    error_log($errorMsg);
                }
            }

            // Esperar antes de la próxima iteración
            if ($maxIterations === 0 || $iteration < $maxIterations) {
                if (!$daemon) {
                    $io->text("⏳ Esperando {$interval} segundos...");
                }
                
                sleep($interval);
            }
        }

        return Command::SUCCESS;
    }
}
