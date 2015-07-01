module.exports = function () {
    var ACCOUNT_SID = process.env.smsAccountSid;
    var AUTH_TOKEN = process.env.smsAuthToken;
    var CONSTANTS = require('../constants/constants');

    var client = require('twilio')(ACCOUNT_SID, AUTH_TOKEN);
    var phoneNumberFormater = require('../helpers/phoneNumberFormater.js');

    this.sendSignUpSMS = function (options) {
        var messageOptions = {
            to: options.phone,
            from: CONSTANTS.TWILIO_CLIENT_NUMBER,
            body: CONSTANTS.SIGN_UP_TEXT
        };
        sendSMS(messageOptions);
    };

    this.onUploadVideoSMS = function (options) {
        var phone = phoneNumberFormater.format(options.first_phone_number);
        var message = "The-No-App on phone # " + phone 
            + " has recorded an encounter at " + options.uploadDate + " at location " 
            + options.locationLink + ".";
        var messageOptions = {
            to: options.first_phone_number,
            from: CONSTANTS.TWILIO_CLIENT_NUMBER,
            body: message
        };
        if (options.second_phone_number && options.second_phone_number !== options.first_phone_number) {
            messageOptions.to = options.first_phone_number + ', ' + options.second_phone_number
        }
        sendSMS(messageOptions);
    };



    function sendSMS (options, callback) {
        client.sendMessage(options, callback)
    }
};