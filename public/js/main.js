require.config({
    paths: {
        domReady: './libs/requirejs-domready/domReady',
        angular: './libs/angular/angular',
        ngRoute: './libs/angular/angular-route.min',
        ngAnimate: './libs/angular/angular-animate.min',
        resource: './libs/angular/angular-resource.min',
        /*Underscore: './libs/underscore-min',*/
        'ui.bootstrap': './libs/ui-bootstrap-tpls-0.11.0.min'
    },
    shim: {
        'angular': {
            exports: 'angular'
        },
        'ngRoute': ['angular'],
        'ngAnimate': ['angular'],
        'ui.bootstrap': ['angular'],
        'resource': ['angular'],
        'app': {
            deps:['angular']
        }
    },
    deps: ['./bootstrap']
});
