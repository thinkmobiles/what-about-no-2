var express = require('express');

module.exports = function (app, PostGre) {
    var logWriter = require('../helpers/logWriter')();
    var badRequests = require('../helpers/badRequests')();
    var SessionHandler = require('../handlers/sessions');
    var UserHandler = require('../handlers/users');
    var CONSTANTS = require('../constants/constants');
    var RESPONSES = require('../constants/responseMessages');
    var videosRouter = require('./videos')(PostGre);
    var session = new SessionHandler(PostGre);
    var users = new UserHandler(PostGre);


    app.get('/', function (req, res, next) {
        res.sendfile('index.html');
    });

    app.use('/videos', videosRouter);

    app.get( '/isAuth', session.authenticatedUser);

    app.post( '/signUp', users.signUp);

    app.post( '/signIn',  users.signIn);

    app.post( '/signOut', users.signOut);

    app.put( '/updateUser', users.updateUser);

    app.get( '/confirmEmail/:confirmToken', users.confirmEmail);

    app.post( '/forgotPassword', users.forgotPassword);

    app.get( '/changePassword/:forgotToken', function ( req, res, next ) {
        res.render('changePassword.html');
    });

    app.post( '/changePassword/:forgotToken', users.changePassword);

    app.get( '/error', function ( req, res, next ) {
        res.render('error.html');
    });

    app.get( '/successConfirm', function ( req, res, next ) {
        res.render('successConfirm.html');
    });

    app.get('/test/sns', users.testSNS);

    function errorHandler( err, req, res, next ) {
        console.error( err.message );
        console.error( err.stack );

        if( process.env.NODE_ENV === 'production' ) {
            res.status( 500).send({error: err.message});
        } else {
            res.status( 500 ).send( {error: err.message + '\n' + err.stack });
            logWriter.log( '', err.message + '\n' + err.stack );
        }
        if(err.redirect){
            res.redirect(process.env.HOST + '/error');
        }
        next();
    }

    app.use( errorHandler );
};