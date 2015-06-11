/**
 * Created by Lapchuk Oleksandr
 */
define(['./module'], function (controllers) {
    'use strict';
    controllers.controller('loginController',
        ['$rootScope', 'Login', '$location', 'ErrorMessages',
            function ($rootScope, Login, $location, ErrMsg) {

                this.user = {};
                var self = this;

                $rootScope.page = 'login';
                this.signIn = function () {
                    Login.login(self.user, function (res) {
                        $rootScope.isLogin = true;
                        $location.path('/');
                    });
                };


            }
        ]
    );
});
