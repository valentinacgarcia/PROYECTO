<?php

/**
 * This file has been auto-generated
 * by the Symfony Routing Component.
 */

return [
    false, // $matchHost
    [ // $staticRoutes
        '/pet/create' => [[['_route' => 'pet_create', '_controller' => 'App\\Controller\\PetController::create'], null, ['POST' => 0], null, false, false, null]],
        '/pet/list-all' => [[['_route' => 'app_pet_listall', '_controller' => 'App\\Controller\\PetController::listAll'], null, ['GET' => 0], null, false, false, null]],
        '/adoptions/request' => [[['_route' => 'adoption_request', '_controller' => 'App\\Controller\\PetLikeController::requestAdoption'], null, ['POST' => 0], null, false, false, null]],
        '/adoptions/notifications' => [[['_route' => 'adoption_notifications', '_controller' => 'App\\Controller\\PetLikeController::getPendingNotifications'], null, ['GET' => 0], null, false, false, null]],
        '/adoptions/matches' => [[['_route' => 'adoption_matches', '_controller' => 'App\\Controller\\PetLikeController::getMatches'], null, ['GET' => 0], null, false, false, null]],
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
                .'|/adoptions/respond/([^/]++)(*:166)'
                .'|/user/(?'
                    .'|de(?'
                        .'|tail/([^/]++)(*:201)'
                        .'|lete/([^/]++)(*:222)'
                    .')'
                    .'|edit/([^/]++)(*:244)'
                .')'
            .')/?$}sDu',
    ],
    [ // $dynamicRoutes
        35 => [[['_route' => '_preview_error', '_controller' => 'error_controller::preview', '_format' => 'html'], ['code', '_format'], null, null, false, true, null]],
        63 => [[['_route' => 'pet_list', '_controller' => 'App\\Controller\\PetController::list'], ['userId'], ['GET' => 0], null, false, true, null]],
        88 => [[['_route' => 'pet_detail', '_controller' => 'App\\Controller\\PetController::detail'], ['id'], ['GET' => 0], null, false, true, null]],
        108 => [[['_route' => 'pet_delete', '_controller' => 'App\\Controller\\PetController::delete'], ['id'], ['DELETE' => 0], null, false, true, null]],
        130 => [[['_route' => 'pet_edit', '_controller' => 'App\\Controller\\PetController::edit'], ['id'], ['PUT' => 0, 'POST' => 1], null, false, true, null]],
        166 => [[['_route' => 'adoption_respond', '_controller' => 'App\\Controller\\PetLikeController::respondToAdoption'], ['id'], ['PATCH' => 0], null, false, true, null]],
        201 => [[['_route' => 'user_detail', '_controller' => 'App\\Controller\\UserController::detail'], ['id'], ['GET' => 0], null, false, true, null]],
        222 => [[['_route' => 'user_delete', '_controller' => 'App\\Controller\\UserController::delete'], ['id'], ['DELETE' => 0], null, false, true, null]],
        244 => [
            [['_route' => 'user_edit', '_controller' => 'App\\Controller\\UserController::edit'], ['id'], ['PUT' => 0], null, false, true, null],
            [null, null, null, null, false, false, 0],
        ],
    ],
    null, // $checkCondition
];
