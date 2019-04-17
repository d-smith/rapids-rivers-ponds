const AWS = require('aws-sdk');
var dynamodb = new AWS.DynamoDB();
var sqs = new AWS.SQS();

const decodeInput = (recordData) => {
    let buff = new Buffer(recordData, 'base64'); 
    return buff.toString('utf-8');
}



const formRiverQName = (river) => {
    return `${river}${process.env.STAGE}`;
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

const write2river = async (subPayloadTuple) => {
    let riverName = formRiverQName(subPayloadTuple.s);
    console.log(`write payload to ${riverName}`);

    return sqs.getQueueUrl({
        QueueName: riverName
    }).promise().then(result => {
        return sqs.sendMessage({
            QueueUrl: result['QueueUrl'],
            MessageBody: JSON.stringify(subPayloadTuple.decoded)
        }).promise();
    }, reason => {
        throw new Error(reason);
    });
}

const handler = async (event) => {
    console.log(JSON.stringify(event));
    for(rec of event['Records']) {
        let decoded = decodeInput(rec.kinesis.data);
        let parsed = JSON.parse(decoded);
        console.log(parsed);

        console.log(`get subscribers for ${parsed.eventType}`);
        let subscribers = await getSubscribersForEvent(parsed.eventType);
        if(subscribers.length == 0) {
            console.log('no subscribers');
            break;
        }

        let zipped = subscribers.map(s => {return {s, decoded}});
        await Promise.all(zipped.map(tuple => {return write2river(tuple)}));
    }
};


module.exports = {
    handler
};