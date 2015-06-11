define(['./module'], function (directives) {
    directives.directive('errpopup', ['$timeout', function ($timeout) {
        return {
            restrict: "E",
            scope: {
                msg: "=",
                type: "@"
            },
            templateUrl: "../../templates/view/errorpopup.html",
            link: function (scope, element) {
                scope.errShow = false;
                scope.$watch('msg', function () {
                    if(scope.msg){
                        scope.errShow = true;
                        $timeout(function () {
                            scope.errShow = false;
                            $timeout(function () {
                                scope.msg = '';
                            }, 250);
                        }, 3000);
                    }
                });
            }
        }
    }]);
});
