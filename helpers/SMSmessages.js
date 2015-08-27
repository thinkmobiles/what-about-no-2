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
        var registerPhoneNumber = options.register_phone_number;
        var firstPhoneNumber = options.first_phone_number;
        var secondPhoneNumber = options.second_phone_number;

        var phone = phoneNumberFormater.format(registerPhoneNumber);
        var message = "The-No-App on phone # " + phone 
            + " has recorded an encounter at " + options.uploadDate + " at location " 
            + options.locationLink + ".";
        var numbers = [registerPhoneNumber];
        var messageOptions;
        
        if (firstPhoneNumber && (numbers.indexOf(firstPhoneNumber) === -1)) {
            numbers.push(firstPhoneNumber);
        }

        if (secondPhoneNumber && (numbers.indexOf(secondPhoneNumber) === -1)) {
            numbers.push(secondPhoneNumber);
        }
        
        numbers.forEach(function (number) { 
            messageOptions = {
                to: number,
                from: CONSTANTS.TWILIO_CLIENT_NUMBER,
                body: message
            };

            sendSMS(messageOptions, function (err, result) {
                if (err) { 
                    console.log('Error:', err);
                }
            });
        });
    };

    function sendSMS (options, callback) {
        client.sendMessage(options, callback)
    }
};