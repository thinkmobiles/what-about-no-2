define([
    'angular',
    'ngRoute',
    'ngAnimate',
    'resource',
    'ui.bootstrap',
    './controllers/index',
    './constants/index',
    './directives/index',
    './services/index'
], function (ng) {
    'use strict';

    return ng.module('app', [
        'ngRoute',
        'ngAnimate',
        'ui.bootstrap',
        'app.services',
        'app.controllers',
        'app.constants',
        'app.directives'
    ]);
});


