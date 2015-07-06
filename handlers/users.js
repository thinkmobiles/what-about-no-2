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

            if (params && params.email && params.pass && params.first_phone_number) {
                if (!EMAIL_REGEXP.test(params.email)) {
                    return next(badRequests.invalidEmail());
                }
                if (params.notification_email && (!EMAIL_REGEXP.test(params.notification_email))) {
                    return next(badRequests.invalidEmail());
                }
                if (!CONSTANTS.PHONE_NUMBER_REGEXP.test(params.first_phone_number)) {
                    return next(badRequests.invalidValue({ message: CONSTANTS.INVALID_PHONE_NUMBER }));
                }
                if (params.second_phone_number && (!CONSTANTS.PHONE_NUMBER_REGEXP.test(params.second_phone_number))) {
                    return next(badRequests.invalidValue({ message: CONSTANTS.INVALID_PHONE_NUMBER }));
                }

                email = params.email;
                notificationEmail = params.notification_email;
                firstPhoneNumber = params.first_phone_number;
                secondPhoneNumber = params.second_phone_number;

                UserModel
                    .fetchMe({
                        first_phone_number: firstPhoneNumber,
                        project: CONSTANTS.PROJECT_NAME
                     })
                    .then(function (existsUser) {
                        var userJSON;
                        var createOptions;

                        if (existsUser && existsUser.id) { //check unique first_phone_number
                            return next(badRequests.invalidValue({message: CONSTANTS.NOT_UNIQUE_PHONE_NUMBER}));
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

            if (params && params.first_phone_number && params.pass) {

                encryptedPass = getEncryptedPass(params.pass);
                UserModel
                    .fetchMe({
                        first_phone_number: params.first_phone_number,
                        password: encryptedPass,
                        project: CONSTANTS.PROJECT_NAME
                    })
                    .then(function (user) {
                        if (user && user.id) {
                            if (user.get("confirmation_token")) {
                                return next(badRequests.unconfirmedEmail({message: CONSTANTS.VERIFY_EMAIL}));
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
        var firstPhoneNumber = params.first_phone_number;
        var email = params.email;

            if (!params || !firstPhoneNumber) {
                return next(badRequests.notEnParams({reqParams: 'first_phone_number'}));
            }
        
            //find the user by phone number:
            UserModel
                .fetchMe({
                    first_phone_number: firstPhoneNumber,
                    project: CONSTANTS.PROJECT_NAME
                })
                .then(function (userModel) {
                    var toEmail;
            
                    if (userModel && userModel.id) { //is exists user:
                
                        userModel
                            .set({
                                'forgot_token': tokenGenerator.generate()
                            })
                            .save()
                            .then(function (user) {
                                var userJSON = user.toJSON();
                                var responseMessage = 'Please check email ' + userJSON.email + ' and proceed by provided link for changing password';
                                    
                                mailer.onForgotPassword(userJSON, function (err) {
                                    if (err) {
                                        logWriter.log(".forgotPassword() -> onForgotPassword()", err);
                                    }
                                });
                                res.status(200).send({success: responseMessage});
                            })
                            .otherwise(next);

                    } else {
                        next(badRequests.notFound({message: CONSTANTS.FIRST_PHONE_NUMBER_ERROR}));
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
            var email = options.email;
            var notificationEmail = options.notification_email;
            var secondPhoneNumber = options.second_phone_number;

            async.waterfall([

                    //validate params:
                    function (cb) {
                
                        //check is exists params for update:
                        if ((email === undefined) && (notificationEmail === undefined) && (secondPhoneNumber === undefined)) {
                            return cb(badRequests.noUpdateParams());
                        }

                        //email:
                        if (email) {
                            if (!EMAIL_REGEXP.test(email)) {
                                return cb(badRequests.invalidEmail());
                            }
                        }
                
                        //notification_email:
                        if (notificationEmail) {
                            if (!EMAIL_REGEXP.test(notificationEmail)) {
                                return cb(badRequests.invalidEmail());
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

                    //update the user:
                    function (currentUser, cb) {
                        var saveOptions = {};
                
                        if (email !== undefined) {
                            saveOptions.email = email;
                        }

                        if (notificationEmail !== undefined) {
                            saveOptions.notification_email = notificationEmail;
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
            );
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