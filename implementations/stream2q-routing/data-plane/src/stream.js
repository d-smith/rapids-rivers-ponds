const AWS = require('aws-sdk');
var dynamodb = new AWS.DynamoDB();
var sqs = new AWS.SQS();

const decodeInput = (recordData) => {
    let buff = new Buffer(recordData, 'base64'); 
    return buff.toString('utf-8');
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
            MessageBody: subPayloadTuple.decoded	
        }).promise();	
    }, reason => {	
        throw new Error(reason);	
    });	
}

const formRiverQName = (river) => {	
    return `${river}${process.env.STAGE}`;	
}

const handler = async (event) => {
    console.log(JSON.stringify(event));
    for(rec of event['Records']) {

        //Decode and parse event
        let decoded = decodeInput(rec.kinesis.data);
        let parsed = JSON.parse(decoded);
        console.log(parsed);

        //Test - who wants this?
        let subs = await getSubscribersForEvent(parsed.eventType);
        console.log(`subscribers for event: ${JSON.stringify(subs)}`);

        //TODO - write stream events to queue
        if(subs.length == 0) {
            console.log('no subscribers');
            break;	       
        }	                   

        let zipped = subs.map(s => {return {s, decoded}});	              
        await Promise.all(zipped.map(tuple => {return write2river(tuple)}));
    }
};


module.exports = {
    handler
};