/**
 * Created by eriy on 27.02.15.
 */
var TABLES = require( '../constants/tables' );

module.exports = function ( PostGre, ParentModel ) {

    return ParentModel.extend( {
        tableName: TABLES.USERS
    });
};