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
    //var AWSModule = require('../helpers/AWSmailer');
    var sns = require('../helpers/AWSmailer');

    var self = this;

    function getEncryptedPass (pass) {
        var shaSum = crypto.createHash('sha256');
        shaSum.update(pass);
        return shaSum.digest('hex');
    }

    this.signUp = function (req, res, next) {
        var params = req.body;
        var emailOptions;
        var smsOptions;
        var err;

        if (params && params.email && params.pass && params.notification_email && params.first_phone_number && params.second_phone_number ) {
            if (!EMAIL_REGEXP.test(params.email) && !EMAIL_REGEXP.test(params.notification_email)) {
                next(badRequests.invalidEmail());
            }
            if (!CONSTANTS.PHONE_NUMBER_REGEXP.test(params.first_phone_number) && !CONSTANTS.PHONE_NUMBER_REGEXP.test(params.second_phone_number)) {
                err = new Error(CONSTANTS.INVALID_PHONE_NUMBER);
                err.status = 400;
                next(err);
            }
            UserModel
                .fetchMe(
                    {
                        email: params.email,
                        project: CONSTANTS.PROJECT_NAME
                    }
                )
                .then(function (existsUser) {
                    var createOptions;
                    var confirmToken;

                    if (existsUser && existsUser.id) {
                        err = new Error(CONSTANTS.NOT_UNIQUE_EMAIL);
                        err.status = 400;
                        next(err);
                    } else {
                        confirmToken = tokenGenerator.generate();
                        createOptions = {
                            email: params.email,
                            notification_email: params.notification_email,
                            first_phone_number: params.first_phone_number,
                            second_phone_number: params.second_phone_number,
                            password: getEncryptedPass(params.pass),
                            confirmation_token: confirmToken,
                            project: CONSTANTS.PROJECT_NAME
                        };

                        UserModel
                            .insert(createOptions)
                            .then(function (user) {
                                emailOptions = {
                                    email: user.get('email'),
                                    confirmToken: confirmToken
                                };
                                smsOptions = {
                                  phone: params.first_phone_number
                                };

                                sms.sendSignUpSMS(smsOptions);
                                mailer.onSendConfirm(emailOptions); //send mail notification to confirm the email;
                                res.status(201).send({success: CONSTANTS.SIGN_UP_TEXT})
                            })
                            .otherwise(next);
                    }
                })
                .otherwise(next);


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
                        next(badRequests.invalidEmail());
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
                .fetchMe({
                    confirmation_token: confirmToken,
                    project: CONSTANTS.PROJECT_NAME
                })
                .then(function (confirmUser) {
                    if (confirmUser && confirmUser.id) {
                        confirmUser
                            .save({confirmation_token: null}, {patch: true})
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
                        .otherwise(function(err){
                            res.render('errorChanging.html', {error: RESPONSES.INTERNAL_ERROR});
                        });

                } else {
                    res.render('errorChanging.html', {error: RESPONSES.INVALID_PARAMETERS});
                }
            })
            .otherwise(function(err){
                res.render('errorChanging.html', {error: RESPONSES.INVALID_PARAMETERS});
            });
    };

    this.updateUser = function (req, res, next) {
        var uId = req.session.userId;
        var options = req.body;
        var saveOptions = {};
        var err;

        if (options.notification_email && EMAIL_REGEXP.test(options.notification_email)) {
            saveOptions.notification_email = options.notification_email;
        }
        if (options.first_phone_number && CONSTANTS.PHONE_NUMBER_REGEXP.test(options.first_phone_number)) {
            saveOptions.first_phone_number = options.first_phone_number;
        }

        if (options.second_phone_number && CONSTANTS.PHONE_NUMBER_REGEXP.test(options.second_phone_number)) {
            saveOptions.second_phone_number = options.second_phone_number;
        }

        UserModel
            .forge({
                id: uId,
                project: CONSTANTS.PROJECT_NAME
            })
            .fetch()
            .then(function (user) {
                if (user && user.id) {
                    user
                        .save(
                        saveOptions,
                        {
                            patch:true
                        })
                        .then(function () {
                            res.status(200).send({success: RESPONSES.SUCCESS_UPDATED})
                        })
                        .otherwise(next)
                } else {
                    err = new Error(RESPONSES.INVALID_PARAMETERS);
                    err.status = 400;
                    next(err);
                }
            })
            .otherwise(next)
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

    this.testSNS = function (req, res, next) {
        var _ = require('underscore');
        var async = require('async');
        var number = '+19049906453';

        async.waterfall([

            //create a new topic:
            /*function (cb) {
                sns.amazonSNS.createTopic({}, function (err, result) {
                    if (err) {
                        return cb(err);
                    }
                    console.log('create result');
                    console.dir(result);
                    cb();
                });
            },*/

            //list topics:
            function (cb) {
                sns.amazonSNS.listTopics({}, function (err, topics) {
                    var arns;

                    if (err) {
                        cb(err);
                    }

                    arns = _.pluck(topics.Topics, 'TopicArn');
                    cb(null, arns);
                });
            },

            //retrive topics:
            function (arns, cb) {
                //cb(null, arns);
                var topics = [];

                async.each(arns, function (arn, parallelCb) {
                    var params = {
                        TopicArn: arn
                    };

                    sns.amazonSNS.getTopicAttributes(params, function (err, topic) {
                        if (err) {
                            return parallelCb(err);
                        }
                        console.log(arn);
                        console.dir(topic);
                        topics.push(topic);
                        parallelCb();
                    });


                }, function (err) {
                    if (err) {
                        return cb(err);
                    }
                    cb(null, topics);
                });

            },

            function (topics, cb) {
                var topic;
                var params = {
                    Protocol: 'email',//'sms',
                    //TopicArn: 'arn:aws:sns:us-east-1:397819774503:demo',
                    Endpoint: 'istvan.nazarovits@gmail.com' //'+1-904-990-6453'
                };

                if (topics && topics[0]) {
                    topic = topics[0];
                }

                if (topic) {
                    params.TopicArn = topic.Attributes.TopicArn;
                    //return cb(null, {topics: topics, subscribe: params.TopicArn});

                    sns.amazonSNS.subscribe(params, function (err, result) {
                        var now = new Date();
                        var publishParams = {
                            Message: "Test_publish_message at " + now.toISOString(),
                            TopicArn: topic.Attributes.TopicArn
                        };

                        if (err) {
                            return cb(err);
                        }
                        console.log('>>> success subscribe ', JSON.stringify(params));

                        sns.amazonSNS.publish(publishParams, function (err, result) {
                            if (err) {
                                return cb(err);
                            }

                            console.log('>>> success publish ', JSON.stringify(params));
                            cb(null, {topics: topics, subscribe: result});
                        });

                    });

                } else {
                    cb(null, {topics: topics, subscribe: null});
                }

            },

            //list subscriptions:
            function (results, cb) {
                sns.amazonSNS.listSubscriptions({}, function (err, subscriptions) {
                    if (err) {
                        return cb(err);
                    }
                    results.subsciptions = subscriptions;
                    cb(null, results);
                });
            }

        ], function (err, result) {
            if (err) {
                return next(err);
            }
            res.send(result);
        });
    };

    this.testSMS = function( req, req) {}
};

module.exports = User;