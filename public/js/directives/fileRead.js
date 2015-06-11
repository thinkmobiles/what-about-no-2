define(['./module'], function (directives) {
    directives.directive('fileread', ['$timeout', function ($timeout) {
        return {
            restrict: "A",
            scope: {
                filepath: "=",
                extension: "=",
                maxsize: "@"
            },
            link: function (scope, element) {
                scope.process = true;
                var fileSize = typeof scope.maxsize !== 'undefined' ? scope.maxsize : 5000000;
                element.bind("change", function (changeEvent) {
                    var reader = new FileReader();
                    reader.onload = function (loadEvent) {
                        var fileType = changeEvent.target.files[0].type;
                        if (fileType === "image/svg+xml") {
                            fileType = "image/svg";
                        }

                        if (changeEvent.target.files[0].size < fileSize) {
                            if (!scope.extension) {

                                scope.filepath = loadEvent.target.result;
                                $timeout(function () {
                                    scope.$apply();
                                });
                            } else if (scope.extension.indexOf(fileType) !== -1) {

                                scope.filepath = loadEvent.target.result;
                                $timeout(function () {
                                    scope.$apply();
                                });
                            } else {
                                alert('File is not ' + scope.extension);
                            }
                        } else {
                            alert('File is too big');
                        }
                    };
                    if (changeEvent.target.files[0])
                        reader.readAsDataURL(changeEvent.target.files[0]);
                });
            }
        }
    }]);
});