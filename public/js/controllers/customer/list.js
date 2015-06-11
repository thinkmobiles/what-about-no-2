/**
 * Created by Lapchuk Oleksandr
 */
define(['./../module'], function (controllers) {
    'use strict';
    controllers.controller('customersController',
        ['$rootScope', '$scope', 'Customer', '$filter',
            function ($rootScope, $scope, Customer, $filter) {

                this.video = [];
                $scope.openTo = true;
                this.video.dateFrom =  $filter('date')(new Date(), 'MM-dd-yyyy');
                this.video.dateTo = $filter('date')(new Date(), 'MM-dd-yyyy');

                this.maxDate = new Date();
                var self = this;

               $rootScope.page = 'customer';

                this.updateVideoList = function () {
                    getVideoList();
                };

                $scope.openFrom = function($event) {
                    $event.preventDefault();
                    $event.stopPropagation();
                    $scope.openedFrom = true;
                };

                $scope.openTo = function($event) {
                    $event.preventDefault();
                    $event.stopPropagation();
                    $scope.openedTo = true;
                };

                function getVideoList() {
                    var data = {
                        email: self.video.email,
                        start: $filter('date')(new Date(self.video.dateFrom), 'yyyy-MM-dd'),
                        end: $filter('date')(new Date(self.video.dateTo), 'yyyy-MM-dd')
                    };
                    Customer.getList(data, function (data) {
                        self.videoList = data;
                    });
                }

            }
        ]
    );
});
