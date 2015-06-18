module.exports = function () {
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
    var paramsDisplayName  = {
        AttributeName: 'DisplayName',
        AttributeValue: 'TEST'
    };
    sns.createTopic({
        'Name': 'Test'
    }, function (err, result) {

        if (err !== null) {
            console.log(util.inspect(err));
            return;
        }
        paramsDisplayName.TopicArn = result.TopicArn
        sns.setTopicAttributes(paramsDisplayName, function(err, data) {
            if (err) console.log(err, err.stack);
            else     console.log(data);
        });
    });

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
