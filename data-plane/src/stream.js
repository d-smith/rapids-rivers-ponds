const AWS = require('aws-sdk');
var sns = new AWS.SNS();

const decodeInput = (recordData) => {
    let buff = new Buffer(recordData, 'base64'); 
    return buff.toString('utf-8');
}

const handler = async (event) => {
    console.log(JSON.stringify(event));
    for(rec of event['Records']) {

        //Decode and parse event
        let decoded = decodeInput(rec.kinesis.data);
        let parsed = JSON.parse(decoded);
        console.log(parsed);

        //Publish to SNS
        let params = {
            Message: decoded,
            MessageAttributes: {
                event_type: {
                    DataType: 'String',
                    StringValue: parsed.eventType
                }
            },
            TopicArn: process.env.TOPIC_ARN
        };

        let response = await sns.publish(params).promise();
        console.log(response);
    }
};


module.exports = {
    handler
};