/**
 * Created by Oleksandr Lapchuk
 */
define(['./module'], function (services) {
    services.factory('Login', ['$http', '$rootScope', 'CustomResponse', function ($http, $rootScope, CustomResp) {
        "use strict";

        this.login = function (data, callback) {
            CustomResp.do($http.post('/signIn', data), callback);
        };

        this.logout = function (callback) {
            CustomResp.do($http.post('/signOut/'), callback);
        };

        this.isAuthenticated = function (callback) {
            if (typeof $rootScope.isLogin !== 'undefined') {
                callback($rootScope.isLogin);
            } else {
                $http.get('/isAuth')
                    .success(function () {
                        $rootScope.isLogin = true;
                        if (callback) callback(true);
                    })
                    .error(function () {
                    $rootScope.isLogin = false;
                    if (callback) callback(false);

                });
            }
        };

        return this;
    }]);
});
