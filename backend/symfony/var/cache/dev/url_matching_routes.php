<?php

/**
 * This file has been auto-generated
 * by the Symfony Routing Component.
 */

return [
    false, // $matchHost
    [ // $staticRoutes
        '/user/list' => [[['_route' => 'user_list', '_controller' => 'App\\Controller\\UserController::list'], null, ['GET' => 0], null, false, false, null]],
        '/user/create' => [[['_route' => 'user_create', '_controller' => 'App\\Controller\\UserController::create'], null, ['POST' => 0], null, false, false, null]],
    ],
    [ // $regexpList
        0 => '{^(?'
                .'|/_error/(\\d+)(?:\\.([^/]++))?(*:35)'
                .'|/user/(?'
                    .'|de(?'
                        .'|tail/([^/]++)(*:69)'
                        .'|lete/([^/]++)(*:89)'
                    .')'
                    .'|sesion/([^/]++)(*:112)'
                    .'|edit/([^/]++)(*:133)'
                .')'
            .')/?$}sDu',
    ],
    [ // $dynamicRoutes
        35 => [[['_route' => '_preview_error', '_controller' => 'error_controller::preview', '_format' => 'html'], ['code', '_format'], null, null, false, true, null]],
        69 => [[['_route' => 'user_detail', '_controller' => 'App\\Controller\\UserController::detail'], ['id'], ['GET' => 0], null, false, true, null]],
        89 => [[['_route' => 'user_delete', '_controller' => 'App\\Controller\\UserController::delete'], ['id'], ['DELETE' => 0], null, false, true, null]],
        112 => [[['_route' => 'user_sesion', '_controller' => 'App\\Controller\\UserController::sesion'], ['id'], ['GET' => 0], null, false, true, null]],
        133 => [
            [['_route' => 'user_edit', '_controller' => 'App\\Controller\\UserController::edit'], ['id'], ['PUT' => 0], null, false, true, null],
            [null, null, null, null, false, false, 0],
        ],
    ],
    null, // $checkCondition
];
