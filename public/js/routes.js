define(['./app'], function (app) {
    'use strict';
    return app.config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/login', {
            controller: 'loginController',
            templateUrl: '../templates/login.html',
            controllerAs: 'loginCtrl',
            reloadOnSearch: false
        }).when('/', {
            controller: 'customersController',
            templateUrl: '../templates/customer/list.html',
            controllerAs: 'custCtrl',
            reloadOnSearch: false
        }).otherwise({
            redirectTo: '/'
        });

    }]).run(['$rootScope', '$location', 'Login', 'MENU', function ($rootScope, $location, Login, MENU) {

        $rootScope.MENU = MENU;
        $rootScope.errMsg = '';
        $rootScope.User = Login;
        
        $rootScope.logout = function(){
            Login.logout(function(res){
                $rootScope.isLogin = false;
                $location.path('login');
            });
        };
        
        $rootScope.$on('$locationChangeStart', function(){
            $rootScope.User.isAuthenticated(function(isLoggedIn){
                if(!isLoggedIn){
                    $rootScope.page = 'login';
                    $location.path("login");
                }
            });
        });

    }]);
});