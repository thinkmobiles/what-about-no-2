/**
 * Created by eriy on 27.02.15.
 */
var TABLES = require( '../constants/tables' );

module.exports = function ( PostGre, ParentCollection ) {
    var Collection = ParentCollection.extend({
        model: PostGre.Models[TABLES.KIT_ORDERS]
    });

    return Collection;
};