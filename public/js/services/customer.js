/**
 * Created by Oleksandr Lapchuk
 */
define(['./module'], function(services){
    services.factory('Customer', ['$http', '$rootScope', 'CustomResponse', function($http, $rootScope, CustResponse){
            "use strict";

            this.getList = function(data, callback){

                var url_str = '/videos?email=' + data.email + '&start=' + data.start + '&end=' + data.end;

                CustResponse.do($http.get(url_str,data), callback);
            };

            return this;
        }]);
});
