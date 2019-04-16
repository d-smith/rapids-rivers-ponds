const AWS = require('aws-sdk');
var dynamodb = new AWS.DynamoDB();

let parseInput = (recordData) => {
    let buff = new Buffer(recordData, 'base64'); 
    let text = buff.toString('utf-8');

    return JSON.parse(text);
}

const getSubscribersForEvent = async (eventType) => {
    let params = {
        ExpressionAttributeValues: {
            ":et": {
                S: eventType
            }
        },
        KeyConditionExpression: "Topic = :et",
        IndexName: 'SubsForTopic',
        TableName: process.env.SUBTABLE
    };

    let response = await dynamodb.query(params).promise();
    console.log(JSON.stringify(response));
    return response['Items'].map(x => x['Subscriber']['S']);
}

const handler = async (event) => {
    console.log(JSON.stringify(event));
    for(rec of event['Records']) {
        let parsed = parseInput(rec.kinesis.data);
        console.log(parsed);

        console.log(`get subscribers for ${parsed.eventType}`);
        let subscribers = await getSubscribersForEvent(parsed.eventType);
        console.log(subscribers);
    }
};


module.exports = {
    handler
};