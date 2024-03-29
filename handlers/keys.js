var Keys = function (PostGre) {
    "use strict";
    var TABLES = require('../constants/tables');
    var crypto = require("crypto");
    var BadRequests = require('../helpers/badRequests')();
    var VideosHandler = require('./videos');
    var KeyModel = PostGre.Models[TABLES.KEYS];
    var UserModel = PostGre.Models[TABLES.USERS];
    var CONSTANTS = require('../constants/constants');
    var RESPONSES = require('../constants/responseMessages');
    var Mailer = require('../helpers/mailer');
    var mailer = new Mailer();
    var SMSModule = require('../helpers/SMSmessages');
    var sms = new SMSModule();

    function removeVideosAndKey(keyId) {
        PostGre.knex(TABLES.VIDEOS)
            .where({
                key_id: keyId,
                project: CONSTANTS.PROJECT_NAME
            })
            .del()
            .then(function () {
                if (process.env.NODE_ENV === 'development') {
                    console.log('Video removed success');
                }
            })
            .otherwise(function (err) {
                console.log("removeVideosAndKey()", "Internal DB Error: " + err);
            });

        PostGre.knex(TABLES.KEYS)
            .where({
                id: keyId,
                project: CONSTANTS.PROJECT_NAME
            })
            .del()
            .then(function () {
                if (process.env.NODE_ENV === 'development') {
                    console.log('Key removed success');
                }
            })
            .otherwise(function (err) {
                console.log(".removeVideosAndKey()", "Internal DB Error: " + err);
            });
    }

    function isExistsKey(key, callback) {
        KeyModel
            .fetchMe({
                key: key,
                project: CONSTANTS.PROJECT_NAME
            })
            .then(function (existsKey) {
                if (existsKey && existsKey.id) {
                    if (callback && (typeof callback === "function")) callback(null, true);
                } else {
                    if (callback && (typeof callback === "function")) callback(null, false);
                }
            })
            .otherwise(function (err) {
                if (callback && (typeof callback === "function")) {
                    callback(err, null);
                }
            });
    }

    this.saveData = function (req, res, next) {
        var params = req.body;
        var userId = req.session.userId;
        var videos = new VideosHandler(PostGre);
        var err;

        if (!params || !params.key || !params.videos) {
            next(BadRequests.notEnParams());
        }

        UserModel
            .fetchMe({
                id: userId,
                project: CONSTANTS.PROJECT_NAME
            }, {
                require: true
            })
            .then(function (currentUser) {
                isExistsKey(params.key, function (err, isExists) {
                    var saveParams;

                    if (err) {
                        return next(err);
                    }

                    if (isExists) {
                        err = new Error(CONSTANTS.KEY_ERROR);
                        err.ststus = 400;
                        return next(err);
                    }

                    saveParams = {
                        user_id: userId,
                        key: params.key,
                        project: CONSTANTS.PROJECT_NAME
                    };

                    KeyModel
                        .insert(saveParams)
                        .then(function (savedKey) {

                            videos.saveVideo(params.videos, savedKey.id, function (err, videoModel) {
                                var mailParams;
                                var smsParams;
                                var uploadDate;
                                var long;
                                var lat;
                                var locationLink;

                                if (err) {
                                    //rollback and send response:
                                    removeVideosAndKey(savedKey.id);
                                    next(err);
                                } else {

                                    long = videoModel.get('longitude');
                                    lat = videoModel.get('latitude');

                                    locationLink = "http://www.google.com/maps/place/"
                                    + lat + "," + long + "/@"
                                    + lat + "," + long + ",15z";

                                    uploadDate = videoModel.get('datetime');
                                    mailParams = {
                                        email: currentUser.get('email'),
                                        phone: currentUser.get('register_phone_number'),
                                        uploadDate: uploadDate,
                                        locationLink: locationLink
                                    };

                                    if (currentUser.get('notification_email') && !(currentUser.get('confirmation_notification_token'))) {
                                        mailParams.notification_email = currentUser.get('notification_email');
                                    }

                                    smsParams = {
                                        register_phone_number: currentUser.get('register_phone_number'),
                                        first_phone_number: currentUser.get('first_phone_number'),
                                        second_phone_number: currentUser.get('second_phone_number'),
                                        uploadDate: uploadDate,
                                        locationLink: locationLink
                                    };

                                    sms.onUploadVideoSMS(smsParams);
                                    mailer.onUploadVideo(mailParams);

                                    res.status(201).send({success: RESPONSES.SUCCESS_SAVED});
                                }
                            });

                        })
                        .otherwise(function (err) {
                            next(err);
                        });

                });
            })
            .otherwise(function (err) {
                next(err);
            });
    }

};

module.exports = Keys;