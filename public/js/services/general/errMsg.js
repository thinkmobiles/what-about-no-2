/**
 * Created by Oleksandr Lapchuk
 */
define(['./../module'], function (services) {
    services.factory('ErrorMessages', ['$location', '$rootScope', function ($location, $rootScope) {
        "use strict";

        $rootScope.errMsg = '';
        this.show = function (err) {
            switch (err.status) {
                case 400:
                    if (err.message) {
                        $rootScope.errMsg = err.message;
                    } else {
                        $rootScope.errMsg = 'Bad Request. The request was invalid or cannot be otherwise served.';
                    }
                    break;
                case 404:
                    $rootScope.errMsg = 'Page not found ';
                    break;
                case 500:
                    if (err.message) {
                        $rootScope.errMsg = err.message;
                    } else {
                        $rootScope.errMsg = 'Something is broken. Please contact to site administrator.';
                    }
                    break;
                case 401:
                    $location.path('/login');
                    break;
                default:
                    console.log(err);
            }
        };

        return this;
    }]);
});