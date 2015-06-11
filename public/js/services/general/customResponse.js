/**
 * Created by Oleksandr Lapchuk
 */
define(['./../module'], function (services) {
    services.factory('CustomResponse', ['ErrorMessages', function (ErrMsg) {
        "use strict";

        var self = this;

        this.do = function (response, callback) {
            response.
                success(function (data) {
                    callback(data);
                }).
                error(function (data, status) {
                    ErrMsg.show({'message': data.error, 'status': status})
                });
        };
        
        return this;
    }]);
});