module.exports = function () {
    var _ = require('../public/js/libs/underscore-min.js');
    var nodemailer = require("nodemailer");
    var fs = require("fs");
    var FROM = "The No App <thenoapp@gmail.com>";
    var moment = require('./moment');
    var phoneNumberFormater = require('./phoneNumberFormater.js');

    this.onSendConfirm = function (options, callback) {
        var templateOptions = {
            email: options.email,
            confirmToken: options.confirmToken,
            host: process.env.HOST
        };
        var mailOptions = {
            from: FROM,
            to: options.email,
            subject: "Confirm Email",
            html: _.template(fs.readFileSync('public/templates/mailer/sendEmailConfirm.html', "utf8"), templateOptions)
        };

        deliver(mailOptions);
    };

    this.onUploadVideo = function (options, callback) {
        var uploadDate = options.uploadDate;
        var uploadMoment = new moment(uploadDate);
        var phone = phoneNumberFormater.format(options.phone);

        var templateOptions = {
            host: process.env.HOST,
            locationLink: options.locationLink,
            phone: phone,
            date: uploadMoment.format('LLLL')
        };
        var mailOptions = {
            from: FROM,
            to: options.email,
            subject: "Upload Video",
            html: _.template(fs.readFileSync('public/templates/mailer/uploadVideo.html', "utf8"), templateOptions)
        };
        if (options.notification_email && (options.notification_email !== options.email)) {
            mailOptions.to = options.email + ', ' + options.notification_email;
        }

        deliver(mailOptions);
    };

    this.onForgotPassword = function (options, callback) {
        var templateOptions = {
            changePasswordLink: process.env.HOST + "/changePassword/" + options.forgot_token
        };
        var mailOptions = {
            from: FROM,
            to: options.email,
            subject: "Forgot Password",
            html: _.template(fs.readFileSync('public/templates/mailer/forgotPassword.html', "utf8"), templateOptions)
        };
        if (options.notification_email && (options.notification_email && !options.confirmation_notification_token) && options.notification_email !== options.email) {
            mailOptions.to = options.email + ', ' + options.notification_email;
        }
        deliver(mailOptions, callback);
    };

    function deliver(mailOptions, cb) {
        var service = process.env.mailerService;
        var user = process.env.mailerUserName;
        var pass = process.env.mailerPassword;

        var smtpTransport = nodemailer.createTransport({
            service: service,
            auth: {
                user: user,
                pass: pass
            }
        });

        smtpTransport.sendMail(mailOptions, function (err, responseResult) {
            if (err) {
                console.log(err);
                if (cb && typeof cb === 'function') {
                    cb(err, null);
                }
            } else {
                console.log('Message sent: ' + responseResult.response);
                if (cb && typeof cb === 'function') {
                    cb(null, responseResult);
                }
            }
        });
    }

    /* return {
     onSendConfirm: onSendConfirm,
     onUploadVideo: onUploadVideo,
     onForgotPassword: onForgotPassword
     }*/
};
