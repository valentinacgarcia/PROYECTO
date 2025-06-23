<?php

/**
 * This file has been auto-generated
 * by the Symfony Routing Component.
 */

return [
    false, // $matchHost
    [ // $staticRoutes
        '/pet/create' => [[['_route' => 'pet_create', '_controller' => 'App\\Controller\\PetController::create'], null, ['POST' => 0], null, false, false, null]],
        '/user/list' => [[['_route' => 'user_list', '_controller' => 'App\\Controller\\UserController::list'], null, ['GET' => 0], null, false, false, null]],
        '/user/sesion' => [[['_route' => 'user_login', '_controller' => 'App\\Controller\\UserController::login'], null, ['POST' => 0], null, false, false, null]],
        '/user/create' => [[['_route' => 'user_create', '_controller' => 'App\\Controller\\UserController::create'], null, ['POST' => 0], null, false, false, null]],
    ],
    [ // $regexpList
        0 => '{^(?'
                .'|/_error/(\\d+)(?:\\.([^/]++))?(*:35)'
                .'|/pet/(?'
                    .'|list/([^/]++)(*:63)'
                    .'|de(?'
                        .'|tail/([^/]++)(*:88)'
                        .'|lete/([^/]++)(*:108)'
                    .')'
                    .'|edit/([^/]++)(*:130)'
                .')'
                .'|/user/(?'
                    .'|de(?'
                        .'|tail/([^/]++)(*:166)'
                        .'|lete/([^/]++)(*:187)'
                    .')'
                    .'|edit/([^/]++)(*:209)'
                .')'
            .')/?$}sDu',
    ],
    [ // $dynamicRoutes
        35 => [[['_route' => '_preview_error', '_controller' => 'error_controller::preview', '_format' => 'html'], ['code', '_format'], null, null, false, true, null]],
        63 => [[['_route' => 'pet_list', '_controller' => 'App\\Controller\\PetController::list'], ['userId'], ['GET' => 0], null, false, true, null]],
        88 => [[['_route' => 'pet_detail', '_controller' => 'App\\Controller\\PetController::detail'], ['id'], ['GET' => 0], null, false, true, null]],
        108 => [[['_route' => 'pet_delete', '_controller' => 'App\\Controller\\PetController::delete'], ['id'], ['DELETE' => 0], null, false, true, null]],
        130 => [[['_route' => 'pet_edit', '_controller' => 'App\\Controller\\PetController::edit'], ['id'], ['PUT' => 0, 'POST' => 1], null, false, true, null]],
        166 => [[['_route' => 'user_detail', '_controller' => 'App\\Controller\\UserController::detail'], ['id'], ['GET' => 0], null, false, true, null]],
        187 => [[['_route' => 'user_delete', '_controller' => 'App\\Controller\\UserController::delete'], ['id'], ['DELETE' => 0], null, false, true, null]],
        209 => [
            [['_route' => 'user_edit', '_controller' => 'App\\Controller\\UserController::edit'], ['id'], ['PUT' => 0], null, false, true, null],
            [null, null, null, null, false, false, 0],
        ],
    ],
    null, // $checkCondition
];
