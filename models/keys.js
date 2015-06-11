/**
 * Created by Roman on 06.03.2015.
 */
var TABLES = require( '../constants/tables' );

module.exports = function ( PostGre, ParentModel ) {

    return ParentModel.extend( {
        tableName: TABLES.KEYS
    });
};