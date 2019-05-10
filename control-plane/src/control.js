const AWS = require('aws-sdk');
var sqs = new AWS.SQS();
var dynamodb = new AWS.DynamoDB();
var sns = new AWS.SNS();
const processUnsubscribe = require('./unsub').processUnsubscribe;
const getTopicSubsForRiver = require('./common').getTopicSubsForRiver;
const processAdvertise = require('./advertise').processAdvertise;

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
        case 'unsubscribe':
            await processUnsubscribe(cmd);
            break;
        case 'advertise':
            await processAdvertise(cmd);
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

const recordSubscription = async (river, topic, subscriptionArn) => {
    console.log(`add sub to table ${process.env.SUBTABLE}`);
    let params = {
        Item: {
            "Subscriber": {
                S: river
            },
            "Topic": {
                S: topic
            },
            "SubscriptionArn": {
                S: subscriptionArn
            }
        },
        TableName: process.env.SUBTABLE
    }

    let response = await dynamodb.putItem(params).promise();
    console.log(response);
}



const enableTopicSendToQueue = async (river, topic) => {

    let statements = [];
    console.log(`add statement for topic ${topic}`);
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
    

    //new sub
    let topicSubResults =  await getTopicSubsForRiver(river);
    let topics = topicSubResults.topics;
    let numberOfPreviousTopics = topics.length;
    console.log(topicSubResults);
    

    //Add the new event type topic to the list to subscribe to
    topics.push(topic);

    //Allow topic to send to queue
    if(numberOfPreviousTopics == 0) {
        await enableTopicSendToQueue(river, topic);
    }; 

    //Bake them into a FilterPolicy
    let filterPolicy = {
        event_type: topics
    };

    console.log(filterPolicy);

    if(numberOfPreviousTopics > 0) {
        console.log('update subscription policy');
        //Update filter policy
        let params = {
            AttributeName: 'FilterPolicy',
            SubscriptionArn: topicSubResults.subscriptionArn,
            AttributeValue: JSON.stringify(filterPolicy)
        };

        let result = await sns.setSubscriptionAttributes(params).promise();
        console.log(result);
        return topicSubResults.subscriptionArn;

    } 

    //Subscribe the queue to the topic with the update filter policy
    console.log('subscribe queue to topic');
    let params = {
        TopicArn: process.env.TOPIC_ARN,
        Protocol: 'sqs',
        Endpoint: `${process.env.QUEUE_ARN_BASE}${formRiverQName(river)}`,
        Attributes: {
            FilterPolicy: JSON.stringify(filterPolicy)
        },
        ReturnSubscriptionArn: true
    }

    let response = await sns.subscribe(params).promise();
    console.log(response);
    return response['SubscriptionArn'];
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

    console.log('subscribe river to topic');
    let subscriptionArn = await subscribeRiverToTopic(river, topic);

    console.log('record subscription');
    //if(subscriptionArn != 'previouslyRecorded') {
        await recordSubscription(river, topic, subscriptionArn);
    //}
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