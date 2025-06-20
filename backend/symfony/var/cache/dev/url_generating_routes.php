<?php

// This file has been auto-generated by the Symfony Routing Component.

return [
    '_preview_error' => [['code', '_format'], ['_controller' => 'error_controller::preview', '_format' => 'html'], ['code' => '\\d+'], [['variable', '.', '[^/]++', '_format', true], ['variable', '/', '\\d+', 'code', true], ['text', '/_error']], [], [], []],
    'user_list' => [[], ['_controller' => 'App\\Controller\\UserController::list'], [], [['text', '/user/list']], [], [], []],
    'user_detail' => [['id'], ['_controller' => 'App\\Controller\\UserController::detail'], [], [['variable', '/', '[^/]++', 'id', true], ['text', '/user/detail']], [], [], []],
    'user_create' => [[], ['_controller' => 'App\\Controller\\UserController::create'], [], [['text', '/user/create']], [], [], []],
    'user_edit' => [['id'], ['_controller' => 'App\\Controller\\UserController::edit'], [], [['variable', '/', '[^/]++', 'id', true], ['text', '/user/edit']], [], [], []],
    'user_delete' => [['id'], ['_controller' => 'App\\Controller\\UserController::delete'], [], [['variable', '/', '[^/]++', 'id', true], ['text', '/user/delete']], [], [], []],
    'App\Controller\UserController::list' => [[], ['_controller' => 'App\\Controller\\UserController::list'], [], [['text', '/user/list']], [], [], []],
    'App\Controller\UserController::detail' => [['id'], ['_controller' => 'App\\Controller\\UserController::detail'], [], [['variable', '/', '[^/]++', 'id', true], ['text', '/user/detail']], [], [], []],
    'App\Controller\UserController::create' => [[], ['_controller' => 'App\\Controller\\UserController::create'], [], [['text', '/user/create']], [], [], []],
    'App\Controller\UserController::edit' => [['id'], ['_controller' => 'App\\Controller\\UserController::edit'], [], [['variable', '/', '[^/]++', 'id', true], ['text', '/user/edit']], [], [], []],
    'App\Controller\UserController::delete' => [['id'], ['_controller' => 'App\\Controller\\UserController::delete'], [], [['variable', '/', '[^/]++', 'id', true], ['text', '/user/delete']], [], [], []],
];
