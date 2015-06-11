/**
 * Created by Roman on 06.03.2015.
 */
var express = require( 'express' );
var router = express.Router();
var multipart = require('connect-multiparty')();
var VideosHandler = require('../handlers/videos');
var KeysHandler = require('../handlers/keys');
var SessionHandler = require('../handlers/sessions');

module.exports = function (PostGre) {
    var keys = new KeysHandler(PostGre);
    var videos = new VideosHandler(PostGre);
    var session = new SessionHandler(PostGre);

    router.get( '/', session.authenticatedSuperAdmin, videos.getVideosByEmail );
    router.post( '/', multipart, session.authenticatedUser, keys.saveData );

    return router;
};