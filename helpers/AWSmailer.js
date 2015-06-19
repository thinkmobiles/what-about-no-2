'use strict';

var SnsModule = function () {
    var AWS = require('aws-sdk');
    var util = require('util');

    AWS.config.update({
        'region': 'us-east-1',
        'accessKeyId': 'AKIAJMYQBVKYPM5BOQFQ',
        'secretAccessKey': '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'
    });


    var sns = new AWS.SNS();

    var params = {
        Protocol: 'sms',
        TopicArn: 'arn:aws:sns:us-east-1:397819774503:demo',
        Endpoint: '+380-66-023-7194'
    };

    this.amazonSNS = sns;

    this.createTopic = function (params, callback) {
        var params = {
            AttributeName: 'DisplayName',
            //AttributeValue: 'TEST'
            AttributeValue: 'Congratulation'
        };

        sns.createTopic({
            //'Name': 'Test'
            Name: 'Congratulation'
        }, function (err, result) {

            if (err) {
                if (callback && (typeof callback === 'function')) {
                    callback(err);
                }
                return console.error(err);
            }
            console.log('>>> result: ');
            console.dir('>>> ', result);
            if (callback && (typeof callback === 'function')) {
                callback(null, result);
            }
            params.TopicArn = result.TopicArn;

            sns.setTopicAttributes(params, function (err, data) {
                if (err) console.log(err, err.stack);
                else     console.log(data);
            });
        });
    };


    /* sns.setTopicAttributes(paramsDisplayName, function(err, data) {
     if (err) console.log(err, err.stack); // an error occurred
     else     console.log(data);           // successful response
     });*/

    /*sns.subscribe(params, function (err, data) {
     if (err) {
     console.log(err, err.stack);
     } else {
     console.log(data);
     }
     });*/

};

module.exports = new SnsModule();