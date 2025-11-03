<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class HomeController extends AbstractController
{
    #[Route('/frontend', name: 'frontend_proxy')]
    public function frontendProxy(): Response
    {
        try {
            $frontendUrl = 'http://frontend:3000';
            
            $context = stream_context_create([
                'http' => [
                    'method' => 'GET',
                    'timeout' => 10,
                    'header' => [
                        'User-Agent: PetMatch-Proxy/1.0',
                        'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                    ]
                ]
            ]);
            
            $frontendContent = @file_get_contents($frontendUrl, false, $context);
            
            if ($frontendContent !== false) {
                $request = $this->container->get('request_stack')->getCurrentRequest();
                $host = $request ? $request->getHost() : '';
                $forwardedHost = $request ? $request->headers->get('X-Forwarded-Host') : '';
                $originalHost = $request ? $request->headers->get('Host') : '';
                
                // Usar la URL del request actual
                $baseUrl = 'https://' . $host;
                $frontendContent = str_replace('src="/', 'src="' . $baseUrl . '/', $frontendContent);
                $frontendContent = str_replace('href="/', 'href="' . $baseUrl . '/', $frontendContent);
                $frontendContent = str_replace('url("/', 'url("' . $baseUrl . '/', $frontendContent);
                $frontendContent = str_replace('http://frontend:3000/', $baseUrl . '/', $frontendContent);
                $frontendContent = str_replace('http://localhost:3000/', $baseUrl . '/', $frontendContent);
                
                // Debug: Log para verificar detección
                error_log("🔍 Frontend - Host detectado: " . $host);
                error_log("🔍 Frontend - X-Forwarded-Host: " . $forwardedHost);
                error_log("🔍 Frontend - Host header: " . $originalHost);
                
                if (str_contains($host, 'trycloudflare.com') || str_contains($forwardedHost, 'trycloudflare.com') || str_contains($originalHost, 'trycloudflare.com')) {
                    error_log("✅ Frontend - Detectado Cloudflare Tunnel, inyectando CSS móvil");
                    $mobileCSS = '
                    <style>
                        * { box-sizing: border-box; }
                        body {
                            margin: 0; padding: 0;
                            font-family: Poppins, sans-serif;
                            background: #fbf7f4; color: #333;
                        }

                        /* ===== NAVBAR MÓVIL CON MENÚ DESPLEGABLE ===== */
                        .navbar {
                            position: fixed !important;
                            top: 0 !important;
                            left: 0 !important;
                            right: 0 !important;
                            z-index: 1000 !important;
                            background-color: #fbf7f4 !important;
                            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
                            padding: 10px 20px !important;
                            height: 60px !important;
                            flex-direction: row !important;
                            justify-content: space-between !important;
                            align-items: center !important;
                        }
                        
                        .navbar-left {
                            flex: 0 0 auto !important;
                            min-width: auto !important;
                            display: flex !important;
                            align-items: center !important;
                        }
                        
                        .logo {
                            height: 40px !important;
                            margin-right: 10px !important;
                        }
                        
                        .brand-name {
                            font-size: 24px !important;
                            font-weight: bold !important;
                            color: #333 !important;
                        }
                        
                        .navbar-center {
                            display: none !important;
                        }
                        
                        .navbar-right {
                            flex: 0 0 auto !important;
                            gap: 10px !important;
                            display: flex !important;
                            align-items: center !important;
                        }
                        
                        /* Botón hamburguesa */
                        .mobile-menu-toggle {
                            display: block !important;
                            background: none !important;
                            border: none !important;
                            font-size: 24px !important;
                            color: #333 !important;
                            cursor: pointer !important;
                            padding: 5px !important;
                        }
                        
                        .nav-button {
                            padding: 8px 16px !important;
                            font-size: 14px !important;
                            background-color: transparent !important;
                            border: 1px solid #53a57d !important;
                            border-radius: 5px !important;
                            color: #53a57d !important;
                            cursor: pointer !important;
                            transition: all 0.3s ease !important;
                        }
                        
                        .nav-button:hover {
                            background-color: #53a57d !important;
                            color: white !important;
                        }
                        
                        .nav-button.register {
                            background-color: #53a57d !important;
                            color: white !important;
                        }
                        
                        .navbar-icons {
                            gap: 10px !important;
                        }
                        
                        .icon-button {
                            font-size: 18px !important;
                            margin-right: 10px !important;
                            color: #333 !important;
                            transition: color 0.2s ease !important;
                            cursor: pointer !important;
                        }
                        
                        .icon-button:hover {
                            color: #53a57d !important;
                        }
                        
                        /* Menú desplegable móvil */
                        .mobile-menu {
                            position: fixed !important;
                            top: 60px !important;
                            left: 0 !important;
                            right: 0 !important;
                            background-color: #fbf7f4 !important;
                            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1) !important;
                            padding: 20px !important;
                            transform: translateY(-100%) !important;
                            transition: transform 0.3s ease !important;
                            z-index: 999 !important;
                        }
                        
                        .mobile-menu.open {
                            transform: translateY(0) !important;
                        }
                        
                        .mobile-menu a {
                            display: block !important;
                            padding: 15px 0 !important;
                            border-bottom: 1px solid #eee !important;
                            text-decoration: none !important;
                            color: #333 !important;
                            font-size: 16px !important;
                            font-weight: 600 !important;
                            transition: color 0.2s ease !important;
                        }
                        
                        .mobile-menu a:hover {
                            color: #53a57d !important;
                        }
                        
                        .mobile-menu a:last-child {
                            border-bottom: none !important;
                        }
                        
                        .perfil-dropdown {
                            right: 0 !important;
                            min-width: 150px !important;
                            background-color: #fbf7f4 !important;
                            border: 1px solid #ccc !important;
                            border-radius: 6px !important;
                            box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1) !important;
                        }
                        
                        .bell-dropdown {
                            right: 0 !important;
                            width: 250px !important;
                            background-color: #fff !important;
                            box-shadow: 0 3px 12px rgba(0,0,0,0.25) !important;
                            border-radius: 10px !important;
                        }

                        /* === Drawer === */
                        .nav-overlay {
                            position: fixed; inset: 0;
                            background: rgba(0,0,0,0.4);
                            backdrop-filter: blur(4px);
                            opacity: 0; pointer-events: none;
                            transition: opacity 0.3s ease;
                            z-index: 999;
                        }
                        .nav-overlay.open { opacity: 1; pointer-events: all; }

                        .mobile-menu {
                            position: fixed; top: 0; right: -80%;
                            width: 70%; height: 100%;
                            background: #fff;
                            box-shadow: -2px 0 10px rgba(0,0,0,0.15);
                            border-radius: 12px 0 0 12px;
                            transition: right 0.3s ease;
                            z-index: 1000;
                            padding: 80px 20px 20px;
                            display: flex; flex-direction: column; gap: 20px;
                        }
                        .mobile-menu.open { right: 0; }

                        .mobile-menu a {
                            color: #333; text-decoration: none;
                            font-size: 18px; font-weight: 500;
                            border-bottom: 1px solid #eee;
                            padding-bottom: 8px;
                            transition: color 0.2s;
                        }
                        .mobile-menu a:hover { color: #53a57d; }

                        .close-menu {
                            position: absolute; top: 18px; right: 18px;
                            font-size: 26px; color: #333;
                            background: none; border: none;
                        }

                        /* === Ajustes de contenido === */
                        .home-page { margin-top: 60px; }
                        html { scroll-behavior: smooth; }
                        
                        /* === NOTIFICACIONES MÓVILES === */
                        .mobile-notifications {
                            display: flex !important;
                            align-items: center !important;
                            margin-right: 10px !important;
                            position: relative !important;
                            z-index: 1001 !important;
                        }
                        
                        /* === BURBUJA DE CHAT MÓVIL === */
                        .mobile-chat-bubble {
                            position: fixed !important;
                            bottom: 20px !important;
                            right: 20px !important;
                            width: 60px !important;
                            height: 60px !important;
                            background: linear-gradient(135deg, #53a57d, #6db890) !important;
                            border-radius: 50% !important;
                            display: flex !important;
                            align-items: center !important;
                            justify-content: center !important;
                            cursor: pointer !important;
                            box-shadow: 0 4px 12px rgba(83, 165, 125, 0.4) !important;
                            z-index: 999 !important;
                            transition: all 0.3s ease !important;
                        }
                        
                        .mobile-chat-bubble:hover {
                            transform: scale(1.1) !important;
                            box-shadow: 0 6px 20px rgba(83, 165, 125, 0.6) !important;
                        }
                        
                        .mobile-chat-bubble svg {
                            color: white !important;
                            font-size: 28px !important;
                        }
                        
                        .mobile-chat-bubble .unread-badge {
                            position: absolute !important;
                            top: -5px !important;
                            right: -5px !important;
                            background-color: #ff4444 !important;
                            color: white !important;
                            border-radius: 50% !important;
                            width: 24px !important;
                            height: 24px !important;
                            display: flex !important;
                            align-items: center !important;
                            justify-content: center !important;
                            font-size: 12px !important;
                            font-weight: bold !important;
                            border: 2px solid white !important;
                        }
                        
                        .mobile-chat-panel {
                            position: fixed !important;
                            bottom: 0 !important;
                            left: 0 !important;
                            right: 0 !important;
                            height: 80vh !important;
                            background-color: white !important;
                            box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15) !important;
                            z-index: 1000 !important;
                            border-radius: 20px 20px 0 0 !important;
                            overflow: hidden !important;
                            display: flex !important;
                            flex-direction: column !important;
                        }
                        
                        .mobile-chat-header {
                            background: linear-gradient(135deg, #53a57d, #6db890) !important;
                            color: white !important;
                            padding: 15px 20px !important;
                            display: flex !important;
                            justify-content: space-between !important;
                            align-items: center !important;
                        }
                        
                        .mobile-chat-header h3 {
                            margin: 0 !important;
                            font-size: 18px !important;
                        }
                        
                        .mobile-chat-close {
                            background: none !important;
                            border: none !important;
                            color: white !important;
                            font-size: 24px !important;
                            cursor: pointer !important;
                            padding: 0 !important;
                        }
                        
                        .mobile-chat-content {
                            flex: 1 !important;
                            overflow-y: auto !important;
                            padding: 10px !important;
                        }
                    </style>
                    <script>
                    document.addEventListener("DOMContentLoaded", () => {
                        const btn = document.querySelector(".hamburger");
                        const overlay = document.querySelector(".nav-overlay");
                        const menu = document.querySelector(".mobile-menu");
                        const close = document.querySelector(".close-menu");
                        if (btn && overlay && menu && close) {
                            btn.addEventListener("click", () => {
                                overlay.classList.add("open");
                                menu.classList.add("open");
                            });
                            overlay.addEventListener("click", () => {
                                overlay.classList.remove("open");
                                menu.classList.remove("open");
                            });
                            close.addEventListener("click", () => {
                                overlay.classList.remove("open");
                                menu.classList.remove("open");
                            });
                        }
                    });
                    </script>
                    <div class="nav-overlay"></div>
                    <div class="mobile-menu">
                        <button class="close-menu">×</button>
                        <a href="/">Inicio</a>
                        <a href="/adopt">Adoptar</a>
                        <a href="/post">Dar en adopción</a>
                        <a href="/services">Servicios</a>
                        <a href="/perfil">Mi perfil</a>
                    </div>
                    <script>
                        // JavaScript para el menú hamburguesa móvil
                        document.addEventListener("DOMContentLoaded", function() {
                            // Crear botón hamburguesa si no existe
                            const navbar = document.querySelector(".navbar");
                            if (navbar && !document.querySelector(".mobile-menu-toggle")) {
                                const hamburgerBtn = document.createElement("button");
                                hamburgerBtn.className = "mobile-menu-toggle";
                                hamburgerBtn.innerHTML = "☰";
                                hamburgerBtn.setAttribute("aria-label", "Abrir menú");
                                
                                const navbarRight = navbar.querySelector(".navbar-right");
                                if (navbarRight) {
                                    navbarRight.insertBefore(hamburgerBtn, navbarRight.firstChild);
                                }
                                
                                // Crear menú desplegable si no existe
                                if (!document.querySelector(".mobile-menu")) {
                                    const mobileMenu = document.createElement("div");
                                    mobileMenu.className = "mobile-menu";
                                    mobileMenu.innerHTML = `
                                        <a href="/frontend">🏠 Inicio</a>
                                        <a href="/frontend/adoption">🐕 Adoptar</a>
                                        <a href="/frontend/services">🛠️ Servicios</a>
                                        <a href="/frontend/chat">💬 Chat</a>
                                        <a href="/frontend/login">👤 Iniciar Sesión</a>
                                        <a href="/frontend/register">📝 Registrarse</a>
                                    `;
                                    document.body.appendChild(mobileMenu);
                                }
                                
                                // Funcionalidad del menú
                                hamburgerBtn.addEventListener("click", function() {
                                    const mobileMenu = document.querySelector(".mobile-menu");
                                    if (mobileMenu) {
                                        mobileMenu.classList.toggle("open");
                                        hamburgerBtn.innerHTML = mobileMenu.classList.contains("open") ? "✕" : "☰";
                                    }
                                });
                                
                                // Cerrar menú al hacer clic en un enlace
                                const menuLinks = document.querySelectorAll(".mobile-menu a");
                                menuLinks.forEach(link => {
                                    link.addEventListener("click", function() {
                                        const mobileMenu = document.querySelector(".mobile-menu");
                                        if (mobileMenu) {
                                            mobileMenu.classList.remove("open");
                                            hamburgerBtn.innerHTML = "☰";
                                        }
                                    });
                                });
                                
                                // Cerrar menú al hacer clic fuera
                                document.addEventListener("click", function(e) {
                                    const mobileMenu = document.querySelector(".mobile-menu");
                                    const hamburgerBtn = document.querySelector(".mobile-menu-toggle");
                                    if (mobileMenu && hamburgerBtn && 
                                        !mobileMenu.contains(e.target) && 
                                        !hamburgerBtn.contains(e.target)) {
                                        mobileMenu.classList.remove("open");
                                        hamburgerBtn.innerHTML = "☰";
                                    }
                                });
                            }
                        });
                    </script>';

                    $frontendContent = str_replace('</head>', $mobileCSS . '</head>', $frontendContent);
                }
                
                return new Response($frontendContent, 200, ['Content-Type' => 'text/html']);
            }

            return new Response('Frontend no disponible', 503);
            
        } catch (\Exception $e) {
            error_log("Error accediendo al frontend: " . $e->getMessage());
            return new Response('Error accediendo al frontend: ' . $e->getMessage(), 503);
        }
    }

    #[Route('/static/{path}', name: 'frontend_static_proxy', requirements: ['path' => '.+'])]
    public function frontendStaticProxy(string $path): Response
    {
        try {
            $frontendUrl = 'http://frontend:3000/static/' . $path;
            $context = stream_context_create(['http' => ['method' => 'GET', 'timeout' => 10]]);
            $content = @file_get_contents($frontendUrl, false, $context);
            
            if ($content !== false) {
                $extension = pathinfo($path, PATHINFO_EXTENSION);
                $contentType = match (strtolower($extension)) {
                    'js' => 'application/javascript',
                    'css' => 'text/css',
                    'png' => 'image/png',
                    'jpg', 'jpeg' => 'image/jpeg',
                    'gif' => 'image/gif',
                    'svg' => 'image/svg+xml',
                    'ico' => 'image/x-icon',
                    default => 'application/octet-stream',
                };
                return new Response($content, 200, ['Content-Type' => $contentType]);
            }
            return new Response('Archivo no encontrado', 404);
        } catch (\Exception $e) {
            error_log("Error accediendo a archivo estático: " . $e->getMessage());
            return new Response('Error accediendo a archivo estático: ' . $e->getMessage(), 500);
        }
    }

    #[Route('/{path}', name: 'frontend_general_proxy', requirements: ['path' => '^(?!pet/|services/|chats/|user/|adoptions/|recommendations/|cache-stats|proxy-image|upload-temp|force-sync|sync-status|api/).+'])]
    public function frontendGeneralProxy(string $path): Response
    {
        try {
            $frontendUrl = 'http://frontend:3000/' . $path;
            $context = stream_context_create(['http' => ['method' => 'GET', 'timeout' => 10]]);
            $content = @file_get_contents($frontendUrl, false, $context);
            
            if ($content !== false) {
                $extension = pathinfo($path, PATHINFO_EXTENSION);
                $contentType = match (strtolower($extension)) {
                    'js' => 'application/javascript',
                    'css' => 'text/css',
                    'png' => 'image/png',
                    'jpg', 'jpeg' => 'image/jpeg',
                    'gif' => 'image/gif',
                    'svg' => 'image/svg+xml',
                    'ico' => 'image/x-icon',
                    'html' => 'text/html',
                    'json' => 'application/json',
                    default => 'application/octet-stream',
                };
                return new Response($content, 200, ['Content-Type' => $contentType]);
            }
            return new Response('Archivo no encontrado', 404);
        } catch (\Exception $e) {
            error_log("Error accediendo a archivo del frontend: " . $e->getMessage());
            return new Response('Error accediendo a archivo del frontend: ' . $e->getMessage(), 500);
        }
    }

    #[Route('/', name: 'home')]
    public function index(): Response
    {
        $request = $this->container->get('request_stack')->getCurrentRequest();
        $host = $request ? $request->getHost() : '';
        $forwardedHost = $request ? $request->headers->get('X-Forwarded-Host') : '';
        
        // Si es Cloudflare Tunnel, redirigir automáticamente al frontend
        if (str_contains($host, 'trycloudflare.com') || str_contains($forwardedHost, 'trycloudflare.com')) {
            return $this->redirect('/frontend');
        }

        return $this->redirect('/frontend');
    }
}
