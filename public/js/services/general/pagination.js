/**
 * Created by Oleksandr Lapchuk
 */
define(['./../module'], function (services) {
    services.factory('Pagination', function () {
        "use strict";

        var self = this;

        //count = limit item per page; page = current page; pages = all pages
        this.defaultPaginationValue = function () {
            return {
                'count': 10,
                'page': 0,
                'items': 0,
                'totalPage': 0,
                'maxPages': 10
            };
        };

        this.calculateTotalPages = function (pagination) {
            var items = pagination.items;
            if (items > 1) {
                var pageLimit = pagination.count;
                var total = Math.ceil(items / pageLimit);
                pagination.totalPage = total;
            } else {
                pagination = self.defaultPaginationValue();
            }
        };

        this.decPaginationItems = function (pagination, callback) {
            pagination.items--;
            self.calculateTotalPages(pagination);
            if (pagination.page > pagination.totalPage) {
                pagination.page--;
            }
            callback();
        };

        return this;
    });
});