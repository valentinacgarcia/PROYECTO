<?php

namespace ContainerK5gAxVG;

use Symfony\Component\DependencyInjection\Argument\RewindableGenerator;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\DependencyInjection\Exception\RuntimeException;

/**
 * @internal This class has been auto-generated by the Symfony Dependency Injection Component.
 */
class getUserControllerdetailService extends App_KernelDevDebugContainer
{
    /**
     * Gets the private '.service_locator.OzEre6h.App\Controller\UserController::detail()' shared service.
     *
     * @return \Symfony\Component\DependencyInjection\ServiceLocator
     */
    public static function do($container, $lazyLoad = true)
    {
        return $container->privates['.service_locator.OzEre6h.App\\Controller\\UserController::detail()'] = ($container->privates['.service_locator.OzEre6h'] ?? $container->load('get_ServiceLocator_OzEre6hService'))->withContext('App\\Controller\\UserController::detail()', $container);
    }
}
