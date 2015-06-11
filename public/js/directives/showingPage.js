define(['./module'], function (directives) {
    directives.directive('showingPage', function () {
        'use strict'
        return {
            restrict: "E",
             templateUrl: '/templates/view/showingPage.html',
            scope: {
                page: "=",
                items: "=",
                count: "="
            },
            link: function (scope, element) {
                scope.$watchGroup(['page','items','count'],function(){
                    scope.entries_total = scope.items;
                    scope.entries_from = (scope.count * (scope.page - 1)) + 1;
                    scope.entries_to = scope.count * scope.page < scope.items ? scope.count * scope.page : scope.items ;
                }); 
            }
        }
    });
});
