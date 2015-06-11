define([
    'require',
    'angular',
    'app',
    'routes',
    'ui.bootstrap'
], function (require, ng) {
    'use strict';

    require(['domReady!'], function (document) {
        ng.bootstrap(document, ['app']);
    });
});