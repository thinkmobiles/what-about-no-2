/**
 * Created by Roman on 23.02.2015.
 */

var TABLES = require('../constants/tables');

var Models = function ( PostGre ) {
    "use strict";
    var Model = PostGre.Model.extend({
        hasTimestamps: true,
        getName: function(){
            return this.tableName.replace( /s$/, '' )
        }
    }, {
        fetchMe: function ( fetchQuery, fetchOptions ) {
            return this.forge( fetchQuery ).fetch( fetchOptions );
        },
        insert: function ( requestBody, customBody, saveOptions ) {
            return this.forge( requestBody ).save( customBody, saveOptions );
        }
    });

    this[TABLES.USERS] =  require('./user')( PostGre, Model );
    this[TABLES.VIDEOS] =  require('./videos')( PostGre, Model );
    this[TABLES.KEYS] =  require('./keys')( PostGre, Model );

};
module.exports = Models;