/**
 * Created by Roman on 23.02.2015.
 */
var TABLES = require( '../constants/tables' );

var Collections  = function ( PostGre ) {
    var Collection = PostGre.Collection.extend({

    });

    this[TABLES.USERS] =  require('./users')( PostGre, Collection );

};
module.exports = Collections;