const AWS = require('aws-sdk');
var sqs = new AWS.SQS();
var dynamodb = new AWS.DynamoDB();
var sns = new AWS.SNS();

let parseInput = (recordData) => {
    let buff = new Buffer(recordData, 'base64'); 
    let text = buff.toString('utf-8');

    return JSON.parse(text);
}

let dispatchCommand = async (cmd) => {
    switch(cmd.command) {
        case 'subscribe':
            await processSubscribe(cmd);
            break;
        default:
            console.log(`Command not supported: ${JSON.stringify(cmd)}`);
            break;
    }
}

let formRiverQName = (river) => {
    return `${river}${process.env.STAGE}`;
}
let hasRiver = async (river) => {
    let riverQName = formRiverQName(river);
    
    console.log(`check to see if ${riverQName} exists`);
    
    try {
        let response = await sqs.getQueueUrl({
                QueueName: riverQName
            }).promise();
        console.log(response);

        return true;
    } catch(e) {
        if(e.code == 'AWS.SimpleQueueService.NonExistentQueue') {
            return false;
        } else {
            throw e;
        }
    }
}

const createRiver = async (river) => {
    let riverQName = formRiverQName(river);
    console.log(`create queue ${riverQName} for river ${river}`);

    let response = await sqs.createQueue({
        QueueName: riverQName
    }).promise();
    console.log(response);
}

const recordSubscription = async (river, topic) => {
    console.log(`add sub to table ${process.env.SUBTABLE}`);
    let params = {
        Item: {
            "Subscriber": {
                S: river
            },
            "Topic": {
                S: topic
            }
        },
        TableName: process.env.SUBTABLE
    }

    let response = await dynamodb.putItem(params).promise();
    console.log(response);
}

const getTopicSubsForRiver = async (river) => {
    let params = {
        ExpressionAttributeValues: {
            ":sv": {
                S: river
            }
        },
        KeyConditionExpression: "Subscriber = :sv",
        ProjectionExpression: 'Topic',
        TableName: process.env.SUBTABLE
    };

    let response = await dynamodb.query(params).promise();
    console.log(JSON.stringify(response));
    let items = response["Items"];

    return items.map(i => {return i["Topic"]["S"]});
}

const enableTopicSendToQueue = async (river, topics) => {
    let statements = [];
    for(t of topics) {
        console.log(`add statement for topic ${t}`);
        let statement = {
            Effect: "Allow",
            Principal: {
                AWS: "*"
            },
            Action: "SQS:SendMessage",
            Resource: `${process.env.QUEUE_ARN_BASE}${formRiverQName(river)}`,
            Condition: {
                ArnEquals: {
                    "aws:SourceArn":process.env.TOPIC_ARN
                }
            }
        }

        statements.push(statement)
    }

    let queuePolicy = {
        Version: '2012-10-17',
        Id: `${process.env.QUEUE_ARN_BASE}${formRiverQName(river)}/MySQSPolicy`,
        Statement: statements
    }

    let params = {
        Attributes: {
            Policy: JSON.stringify(queuePolicy)
        },
        QueueUrl: `${process.env.QUEUE_URL_BASE}${formRiverQName(river)}`
    };

    console.log(JSON.stringify(params));

    let response = await sqs.setQueueAttributes(params).promise();
    console.log(response);
}

const subscribeRiverToTopic = async (river, topic) => {
    

    //Grab all the subscriptions we know about
    let topics =  await getTopicSubsForRiver(river);
    console.log(topics);

    //Allow topic to send to queue
    await enableTopicSendToQueue(river, topics);

    //Bake them into a FilterPolicy
    let filterPolicy = {
        event_type: topics
    };

    //Subscribe the queue to the topic with the update filter policy
    let params = {
        TopicArn: process.env.TOPIC_ARN,
        Protocol: 'sqs',
        Endpoint: `${process.env.QUEUE_ARN_BASE}${formRiverQName(river)}`,
        Attributes: {
            FilterPolicy: JSON.stringify(filterPolicy)
        }
    }

    let response = await sns.subscribe(params).promise();
    console.log(response);
};

let processSubscribe = async (cmd) => {
    console.log(JSON.stringify(cmd));
    let river = cmd.commandArgs.river;
    let topic = cmd.commandArgs.topic;

    console.log(`subscribe ${river} to ${topic}`);
    console.log('check river for stage ' + process.env.STAGE);
    let riverExists = await hasRiver(river);
    if(!riverExists) {
        console.log('create river...');
        await createRiver(river);
    } else {
        console.log('river exists... subscribe');
    }

    console.log('record subscription');
    await recordSubscription(river, topic);

    console.log('subscribe river to topic');
    await subscribeRiverToTopic(river, topic);
} 

const handler = async(event, context) => {
    console.log(JSON.stringify(event));
    console.log(JSON.stringify(context));

    for(rec of event['Records']) {
        try {
            parsed = parseInput(rec.kinesis.data);
            await dispatchCommand(parsed);
        } catch(e) {
            console.log(e); //This throws away the record - might want to write it to a DLQ
        }
    }
}

module.exports = {
    handler
};