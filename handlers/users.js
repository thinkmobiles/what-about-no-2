/**
 * Created by Roman on 12.02.2015.
 */
var User = function (PostGre) {
        var logWriter = require('../helpers/logWriter')();
        var tokenGenerator = require('../helpers/randomPass.js');
        var TABLES = require('../constants/tables');
        var RESPONSES = require('../constants/responseMessages');
        var EMAIL_REGEXP = require('../constants/constants').EMAIL_REGEXP;
        var CONSTANTS = require('../constants/constants');
        var UserModel = PostGre.Models[TABLES.USERS];
        var crypto = require('crypto');
        var SessionHandler = require('./sessions');
        var session = new SessionHandler(PostGre);
        var badRequests = require('../helpers/badRequests')();
        var Mailer = require('../helpers/mailer');
        var mailer = new Mailer();
        var SMSModule = require('../helpers/SMSmessages');
        var sms = new SMSModule();
        var async = require('async');

        //var AWSModule = require('../helpers/AWSmailer');
        var sns = require('../helpers/AWSmailer');

        var self = this;

        function getEncryptedPass(pass) {
            var shaSum = crypto.createHash('sha256');
            shaSum.update(pass);
            return shaSum.digest('hex');
        }

        this.signUp = function (req, res, next) {
            var params = req.body;
            var email;
            var notificationEmail;
            var firstPhoneNumber;
            var secondPhoneNumber;
            var err;

            if (params && params.email && params.pass && params.first_phone_number) {
                if (!EMAIL_REGEXP.test(params.email)) {
                    return next(badRequests.invalidEmail());
                }
                if (params.notification_email && (!EMAIL_REGEXP.test(params.notification_email))) {
                    return next(badRequests.invalidEmail());
                }
                if (!CONSTANTS.PHONE_NUMBER_REGEXP.test(params.first_phone_number)) {
                    err = new Error(CONSTANTS.INVALID_PHONE_NUMBER);
                    err.status = 400;
                    return next(err);
                }
                if (params.second_phone_number && (!CONSTANTS.PHONE_NUMBER_REGEXP.test(params.second_phone_number))) {
                    err = new Error(CONSTANTS.INVALID_PHONE_NUMBER);
                    err.status = 400;
                    return next(err);
                }

                email = params.email;
                notificationEmail = params.notification_email;
                firstPhoneNumber = params.first_phone_number;
                secondPhoneNumber = params.second_phone_number;

                UserModel
                    .forge()
                    .query(function (qb) {
                        var sql = "( ";

                        sql += " (email='" + email + "') OR (first_phone_number='" + firstPhoneNumber + "') ";
                        sql += " OR (notification_email='" + email + "') OR (second_phone_number='" + firstPhoneNumber + "')";

                        if (notificationEmail) {
                            sql += " OR (notification_email='" + notificationEmail + "') OR (email='" + notificationEmail + "')";
                        }

                        if (secondPhoneNumber) {
                            sql += " OR (second_phone_number='" + secondPhoneNumber + "') OR (first_phone_number='" + secondPhoneNumber + "')";
                        }

                        sql += ") AND project='" + CONSTANTS.PROJECT_NAME + "' ";

                        return qb.whereRaw(sql);
                    })
                    /*.fetchMe({
                     email: params.email,
                     project: CONSTANTS.PROJECT_NAME
                     })*/
                    .fetch()
                    .then(function (existsUser) {
                        var userJSON;
                        var createOptions;

                        if (existsUser && existsUser.id) { //check unique email, notification_email, first_phone_number, second_phone_number;

                            userJSON = existsUser.toJSON();

                            err = new Error();
                            err.status = 400;

                            if ((email === userJSON.email)
                                || (email === userJSON.notification_email)
                                || (notificationEmail === userJSON.email)
                                || (notificationEmail === userJSON.notification_email)
                            ) {
                                err.message = CONSTANTS.NOT_UNIQUE_EMAIL;
                            }

                            if ((firstPhoneNumber === userJSON.first_phone_number)
                                || (firstPhoneNumber === userJSON.second_phone_number)
                                || (secondPhoneNumber === userJSON.first_phone_number)
                                || (secondPhoneNumber === userJSON.second_phone_number)
                            ) {
                                err.message = CONSTANTS.NOT_UNIQUE_PHONE_NUMBER;
                            }

                            return next(err);
                        }

                        createOptions = {
                            email: email,
                            first_phone_number: firstPhoneNumber,
                            password: getEncryptedPass(params.pass),
                            confirmation_token: tokenGenerator.generate(),
                            project: CONSTANTS.PROJECT_NAME
                        };

                        if (notificationEmail) {
                            createOptions.notification_email = notificationEmail;
                            createOptions.confirmation_notification_token = tokenGenerator.generate();
                        }

                        if (secondPhoneNumber) {
                            createOptions.second_phone_number = secondPhoneNumber;
                        }

                        UserModel
                            .insert(createOptions)
                            .then(function (userModel) {
                                var smsOptions = {
                                    phone: userModel.get('first_phone_number')
                                };
                                var emailConfirmOptions = {
                                    email: userModel.get('email'),
                                    confirmToken: userModel.get('confirmation_token')
                                };
                                var notificationEmail = userModel.get('notification_email');
                                var notificationToken = userModel.get('confirmation_notification_token');
                                var notificationEmailConfirmOptions;

                                if (notificationEmail && notificationToken) {
                                    notificationEmailConfirmOptions = {
                                        email: notificationEmail,
                                        confirmToken: notificationToken
                                    };
                                }

                                sms.sendSignUpSMS(smsOptions);

                                mailer.onSendConfirm(emailConfirmOptions); //send mail notification to confirm the email;

                                if (notificationEmailConfirmOptions) {
                                    mailer.onSendConfirm(notificationEmailConfirmOptions); //send mail notification to notification_email
                                }

                                res.status(201).send({success: CONSTANTS.SIGN_UP_TEXT})
                            })
                            .otherwise(function (err) {
                                next(err);
                            });

                    })
                    .otherwise(function (err) {
                        next(err);
                    });

            } else {
                next(badRequests.notEnParams());
            }
        };

        this.signOut = function (req, res, next) {
            session.kill(req, res);
        };

        this.signIn = function (req, res, next) {
            var params = req.body;
            var encryptedPass;
            var err;

            if (params && params.email && params.pass) {

                encryptedPass = getEncryptedPass(params.pass);
                UserModel
                    .fetchMe({
                        email: params.email,
                        password: encryptedPass,
                        project: CONSTANTS.PROJECT_NAME
                    })
                    .then(function (user) {
                        if (user && user.id) {
                            if (user.get("confirmation_token")) {
                                err = new Error(CONSTANTS.VERIFY_EMAIL);
                                err.status = 400;
                                return next(err);
                            }

                            req.session.userId = user.id;
                            req.session.loggedIn = true;

                            if (user.get('role') === 0) {
                                req.session.role = 'customer';
                            } else {
                                req.session.role = 'superAdmin';
                            }

                            return res.status(200).send({success: CONSTANTS.LOG_IN});

                        } else {
                            next(badRequests.signInError());
                        }
                    })
                    .otherwise(next);
            } else {
                next(badRequests.notEnParams());
            }
        };

        this.confirmEmail = function (req, res, next) {
            var confirmToken = req.param('confirmToken');
            var err;

            if (confirmToken) {
                UserModel
                    .forge()
                    .query(function (qb) {
                        var sql = "("
                            + "(confirmation_token='" + confirmToken + "' AND project='" + CONSTANTS.PROJECT_NAME + "') "
                            + " OR "
                            + "(confirmation_notification_token='" + confirmToken + "' AND project='" + CONSTANTS.PROJECT_NAME + "') "
                            + ") ";

                        return qb.whereRaw(sql);
                    })
                    .fetch()
                    .then(function (confirmUser) {
                        var saveParams;

                        if (confirmUser && confirmUser.id) {

                            if (confirmUser.get('confirmation_token') === confirmToken) {
                                saveParams = {
                                    confirmation_token: null
                                };
                            } else {
                                saveParams = {
                                    confirmation_notification_token: null
                                };
                            }

                            confirmUser
                                .save(saveParams, {patch: true})
                                .then(function (user) {
                                    res.redirect(process.env.HOST + '/successConfirm');
                                })
                                .otherwise(next);
                        } else {
                            err = new Error(CONSTANTS.CONFIRM_ERROR);
                            err.status = 400;
                            err.redirect = true;
                            next(err);
                        }
                    })
                    .otherwise(function (err) {
                        err.redirect = true;
                        next(err);
                    });
            } else {
                err = badRequests.notEnParams();
                err.redirect = true;

                next(err);
            }
        };

        this.forgotPassword = function (req, res, next) {
            var params = req.body;
            var err;

            if (!params || !params.email) {
                return next(badRequests.notEnParams());
            }

            if (!EMAIL_REGEXP.test(params.email)) {
                return next(badRequests.invalidEmail());
            }

            UserModel
                .fetchMe({
                    email: params.email,
                    project: CONSTANTS.PROJECT_NAME
                })
                .then(function (userModel) {
                    if (userModel && userModel.id) {

                        userModel
                            .set({
                                'forgot_token': tokenGenerator.generate()
                            })
                            .save()
                            .then(function (user) {
                                mailer.onForgotPassword(user.toJSON(), function (err) {
                                    if (err) {
                                        logWriter.log(".forgotPassword() -> onForgotPassword()", err);
                                    }
                                });
                                res.status(200).send({success: CONSTANTS.FORGOT_PASS_TEXT});
                            })
                            .otherwise(next);

                    } else {
                        err = new Error(CONSTANTS.EMAIL_ERROR);
                        err.ststus = 400;
                        next(err);
                    }
                })
                .otherwise(next);

        };

        this.changePassword = function (req, res, next) {
            var params = req.body;
            var forgotToken = req.params.forgotToken;
            var password;
            var confirmPassword;
            var err;

            if (!params || !params.password || !params.repassword) {
                return next(badRequests.notEnParams());
            }

            if (params.pass !== params.confirmPass) {
                err = new Error(CONSTANTS.PASS_ERROR);
                err.status = 400;

                return next(err);
            }

            UserModel
                .fetchMe({
                    forgot_token: forgotToken,
                    project: CONSTANTS.PROJECT_NAME
                })
                .then(function (userModel) {
                    var saveOptions;

                    if (userModel && userModel.id) {
                        saveOptions = {
                            password: getEncryptedPass(params.password),
                            forgot_token: null
                        };

                        userModel
                            .save(saveOptions, {patch: true})
                            .then(function (user) {
                                res.render('afterSuccessChange.html');
                            })
                            .otherwise(function (err) {
                                res.render('errorChanging.html', {error: RESPONSES.INTERNAL_ERROR});
                            });

                    } else {
                        res.render('errorChanging.html', {error: RESPONSES.INVALID_PARAMETERS});
                    }
                })
                .otherwise(function (err) {
                    res.render('errorChanging.html', {error: RESPONSES.INVALID_PARAMETERS});
                });
        };

        this.updateUser = function (req, res, next) {
            var userId = req.session.userId;
            var options = req.body;
            var notificationEmail = options.notification_email;
            var firstPhoneNumber = options.first_phone_number;
            var secondPhoneNumber = options.second_phone_number;

            async.waterfall([

                    //validate params:
                    function (cb) {

                        if ((notificationEmail === undefined) && (firstPhoneNumber === undefined) && (secondPhoneNumber === undefined)) {
                            return cb(badRequests.noUpdateParams());
                        }

                        //notification_email:
                        if (notificationEmail) {
                            if (!EMAIL_REGEXP.test(notificationEmail)) {
                                return cb(badRequests.invalidEmail());
                            }
                        }

                        //first_phone_number:
                        if (firstPhoneNumber) {
                            if (!CONSTANTS.PHONE_NUMBER_REGEXP.test(firstPhoneNumber)) {
                                return cb(badRequests.invalidValue({message: CONSTANTS.INVALID_PHONE_NUMBER}));
                            }
                        }

                        //second_phone_number:
                        if (secondPhoneNumber) {
                            if (!CONSTANTS.PHONE_NUMBER_REGEXP.test(secondPhoneNumber)) {
                                return cb(badRequests.invalidValue({message: CONSTANTS.INVALID_PHONE_NUMBER}));
                            }
                        }

                        cb(); // all right
                    },

                    //find the current user:
                    function (cb) {
                        UserModel
                            .forge({
                                id: userId,
                                project: CONSTANTS.PROJECT_NAME
                            })
                            .fetch({
                                require: true
                            })
                            .then(function (userModel) {
                                cb(null, userModel);
                            })
                            .catch(UserModel.NotFoundError, function (err) {
                                cb(badRequests.notFound({message: CONSTANTS.NOT_FOUND_USER}));
                            })
                            .catch(function (err) {
                                cb(err);
                            });
                    },

                    //check is exists user with same params:
                    function (currentUser, cb) {

                        UserModel
                            .forge()
                            .query(function (qb) {

                                qb.orWhere(function () {

                                    if (notificationEmail !== undefined) {
                                        this.orWhere('notification_email', '=', notificationEmail);
                                        this.orWhere('email', '=', notificationEmail);
                                    }

                                    if (firstPhoneNumber !== undefined) {
                                        this.orWhere('first_phone_number', '=', firstPhoneNumber);
                                        this.orWhere('second_phone_number', '=', firstPhoneNumber);
                                    }

                                    if (secondPhoneNumber !== undefined) {
                                        this.orWhere('second_phone_number', '=', secondPhoneNumber);
                                        this.orWhere('first_phone_number', '=', secondPhoneNumber);
                                    }

                                })
                                    .andWhere('project', '=', CONSTANTS.PROJECT_NAME)
                                    .andWhere('id', '<>', userId); //currentUser

                                return qb;
                            })
                            .fetch()
                            .then(function (existsUser) {
                                var errMessage;
                                var userJSON;

                                if (existsUser && existsUser.id) { //check unique: notification_email, first_phone_number, second_phone_number;
                                    userJSON = existsUser.toJSON();

                                    if ((notificationEmail === userJSON.email) || (notificationEmail === userJSON.notification_email)) {
                                        errMessage = CONSTANTS.NOT_UNIQUE_EMAIL;
                                    }

                                    if ((firstPhoneNumber === userJSON.first_phone_number)
                                        || (firstPhoneNumber === userJSON.second_phone_number)
                                        || (secondPhoneNumber === userJSON.first_phone_number)
                                        || (secondPhoneNumber === userJSON.second_phone_number)
                                    ) {
                                        errMessage = CONSTANTS.NOT_UNIQUE_PHONE_NUMBER;
                                    }

                                    return cb(badRequests.invalidValue({message: errMessage}));

                                }

                                cb(null, currentUser);
                            })
                            .otherwise(function (err) {
                                cb(err);
                            });
                    },

                    //update the user:
                    function (currentUser, cb) {
                        var saveOptions = {};

                        if (notificationEmail !== undefined) {
                            saveOptions.notification_email = notificationEmail;
                        }

                        if (firstPhoneNumber !== undefined) {
                            saveOptions.first_phone_number = firstPhoneNumber;
                        }

                        if (secondPhoneNumber !== undefined) {
                            saveOptions.second_phone_number = secondPhoneNumber;
                        }

                        currentUser
                            .save(saveOptions, {patch: true})
                            .then(function (updatedUser) {
                                cb(null, updatedUser);
                            })
                            .catch(function (err) {
                                cb(err);
                            });
                    }
                ],
                function (err, userModel) {
                    if (err) {
                        return next(err);
                    }
                    res.status(200).send({success: RESPONSES.SUCCESS_UPDATED});
                }
            )
            ;
        };

        this.getUsers = function (req, res, next) {
            var page = req.param('page') || 1;
            var limit = req.param('count') || 25;
            var orderBy = req.param('orderBy');
            var order = req.param('order') || 'ASC';

            var collection = UserCollection
                .forge()
                .query()
                .where({
                    role: 0,
                    project: CONSTANTS.PROJECT_NAME
                })
                .select('id', 'email')
                .offset(( page - 1 ) * limit)
                .limit(limit);

            if (orderBy) {
                collection = collection.orderBy(orderBy, order);
            }

            collection
                .then(function (users) {
                    res.status(200).send(users);
                })
                .otherwise(next);
        };

        this.getUsersCount = function (req, res, next) {
            postGre.knex('users')
                .where({
                    role: 0,
                    project: CONSTANTS.PROJECT_NAME
                })
                .select()
                .then(function (queryResult) {
                    res.status(200).send({success: queryResult.length});
                })
                .otherwise(next);
        };

    };

module.exports = User;