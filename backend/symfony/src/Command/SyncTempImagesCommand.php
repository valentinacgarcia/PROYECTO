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
    name: 'app:sync-temp-images',
    description: 'Sincroniza imágenes temporales con MinIO, actualiza cache y limpia archivos expirados'
)]
class SyncTempImagesCommand extends Command
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
            ->addOption('clean-cache', null, InputOption::VALUE_NONE, 'Limpiar cache de imágenes expirado')
            ->addOption('max-age', null, InputOption::VALUE_REQUIRED, 'Edad máxima del cache en días', 3)
            ->addOption('full-sync', null, InputOption::VALUE_NONE, 'Ejecutar sincronización completa (temp + cache + limpieza)')
            ->addOption('stats', null, InputOption::VALUE_NONE, 'Mostrar estadísticas del cache');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        
        // Mostrar estadísticas si se solicita
        if ($input->getOption('stats')) {
            $this->showStats($io);
            return Command::SUCCESS;
        }

        // Sincronización completa
        if ($input->getOption('full-sync')) {
            $io->title('🔄 Sincronización completa automática');
            $results = $this->imageSyncService->runFullSync();
            $this->displayFullSyncResults($io, $results);
            return Command::SUCCESS;
        }

        $io->title('🔄 Sincronización de imágenes');

        // 1. Sincronizar imágenes temporales
        $io->section('📱 Sincronizando imágenes temporales...');
        $tempResults = $this->imageSyncService->syncTempImages();
        $this->displayResults($io, 'Temporales', $tempResults);

        // 2. Verificar y actualizar cache
        $io->section('🔄 Verificando cambios en MinIO...');
        $cacheResults = $this->imageSyncService->checkAndUpdateCache();
        $this->displayResults($io, 'Cache', $cacheResults);

        // 3. Limpiar cache expirado si se solicita
        if ($input->getOption('clean-cache')) {
            $io->section('🧹 Limpiando cache expirado...');
            $maxAge = (int) $input->getOption('max-age');
            $cleanResults = $this->imageSyncService->cleanExpiredCache($maxAge);
            $this->displayResults($io, 'Limpieza', $cleanResults);
        }

        // 4. Mostrar resumen final
        $this->showFinalSummary($io, $tempResults, $cacheResults);

        $totalErrors = $tempResults['errors'] + $cacheResults['errors'];
        if ($totalErrors > 0) {
            $io->warning("Se encontraron $totalErrors errores durante la sincronización");
            return Command::FAILURE;
        }

        $io->success('Sincronización completada exitosamente');
        return Command::SUCCESS;
    }

    private function displayResults(SymfonyStyle $io, string $type, array $results): void
    {
        $io->text("📊 Resultados de $type:");
        $processed = $results['checked'] ?? $results['synced'] ?? $results['cleaned'];
        $successful = $results['updated'] ?? $results['synced'] ?? $results['cleaned'];
        $io->text("  • Procesados: $processed");
        $io->text("  • Exitosos: $successful");
        $io->text("  • Errores: {$results['errors']}");

        if (!empty($results['details'])) {
            foreach ($results['details'] as $detail) {
                $io->text("  $detail");
            }
        }
    }

    private function displayFullSyncResults(SymfonyStyle $io, array $results): void
    {
        $io->text("🕐 Timestamp: {$results['timestamp']}");
        
        $this->displayResults($io, 'Temporales', $results['temp_sync']);
        $this->displayResults($io, 'Cache', $results['cache_update']);
        $this->displayResults($io, 'Limpieza', $results['cache_cleanup']);

        $totalSynced = $results['temp_sync']['synced'];
        $totalUpdated = $results['cache_update']['updated'];
        $totalCleaned = $results['cache_cleanup']['cleaned'];
        $totalErrors = $results['temp_sync']['errors'] + $results['cache_update']['errors'] + $results['cache_cleanup']['errors'];

        $io->section('📊 Resumen Total');
        $io->table(
            ['Operación', 'Cantidad'],
            [
                ['Imágenes temporales sincronizadas', $totalSynced],
                ['Archivos de cache actualizados', $totalUpdated],
                ['Archivos de cache limpiados', $totalCleaned],
                ['Errores totales', $totalErrors],
            ]
        );
    }

    private function showFinalSummary(SymfonyStyle $io, array $tempResults, array $cacheResults): void
    {
        $io->section('📊 Resumen Final');
        
        $stats = $this->imageSyncService->getCacheStats();
        
        $io->table(
            ['Métrica', 'Cantidad'],
            [
                ['Imágenes temporales sincronizadas', $tempResults['synced']],
                ['Archivos de cache verificados', $cacheResults['checked']],
                ['Archivos de cache actualizados', $cacheResults['updated']],
                ['Errores totales', $tempResults['errors'] + $cacheResults['errors']],
                ['Archivos temporales restantes', $stats['temp_files']],
                ['Archivos en cache', $stats['cache_files']],
                ['Tamaño del cache (MB)', $stats['cache_size_mb']],
            ]
        );
    }

    private function showStats(SymfonyStyle $io): void
    {
        $io->title('📊 Estadísticas del Sistema de Cache');
        
        $stats = $this->imageSyncService->getCacheStats();
        
        $io->table(
            ['Métrica', 'Valor'],
            [
                ['Archivos temporales pendientes', $stats['temp_files']],
                ['Archivos en cache', $stats['cache_files']],
                ['Tamaño del cache', $stats['cache_size_mb'] . ' MB'],
                ['Última sincronización', $stats['last_sync'] ?? 'Nunca'],
            ]
        );

        if ($stats['temp_files'] > 0) {
            $io->warning("Hay {$stats['temp_files']} archivos temporales pendientes de sincronización");
        }

        if ($stats['cache_files'] > 0) {
            $io->success("Cache activo con {$stats['cache_files']} archivos ({$stats['cache_size_mb']} MB)");
        } else {
            $io->info("Cache vacío - se poblará automáticamente al acceder a imágenes");
        }
    }
}
