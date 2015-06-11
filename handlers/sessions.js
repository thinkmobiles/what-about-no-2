var CONSTANTS = require('../constants/constants');

var Session = function ( PostGre ) {

    this.register = function ( req, res, options) {
        if(req.session && options && req.session.userId === options.userId){
            return res.status( 200 ).send( { success: CONSTANTS.LOG_IN, cid: options.id } );
        }
        req.session.loggedIn = true;
        req.session.userId = options.userId;
        req.session.login = options.email;
        res.status( 200 ).send( { success:  CONSTANTS.LOG_IN, cid: options.id } );
    };

    this.kill = function ( req, res, next ) {
        if(req.session) {
            req.session.destroy();
        }
        res.status(200).send({ success: CONSTANTS.LOG_OUT });
    };

    this.authenticatedUser = function ( req, res, next ) {
        if( req.session && req.session.userId && req.session.loggedIn ) {
            next();
        } else {
            var err = new Error(CONSTANTS.UNATHORIZED);
            err.status = 401;
            next(err);
        }
    };

    this.authenticatedSuperAdmin = function ( req, res, next ) {
        if( req.session && req.session.userId && req.session.loggedIn && (req.session.role === 'superAdmin')  ) {
            next();
        } else {
            var err = new Error(CONSTANTS.UNATHORIZED);
            err.status = 401;
            next(err);
        }
    };

};

module.exports = Session;