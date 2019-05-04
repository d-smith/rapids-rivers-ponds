const AWS = require('aws-sdk');
var sqs = new AWS.SQS();
var dynamodb = new AWS.DynamoDB();
var sns = new AWS.SNS();

const getTopicSubsForRiver = require('./common').getTopicSubsForRiver;

const removeTopicFromFilterPolicy = async (river, topic, subs) => {
    console.log(`remove ${topic} from ${JSON.stringify(subs)}`);

    let {subscriptionArn, topics} = subs;

    let filterPolicy = {
        event_type: topics.filter(t => t != topic)
    };

    console.log(`new filter policy ${JSON.stringify(filterPolicy)}`);

    //Update subscription attributes with new policy
    let params = {
        AttributeName: 'FilterPolicy',
        SubscriptionArn: subscriptionArn,
        AttributeValue: JSON.stringify(filterPolicy)
    };

    let result = await sns.setSubscriptionAttributes(params).promise();
    console.log(result);

    //Remove subscription from table
    let deleteParams = {
        Key: {
            "Subscriber": {
                S: river
            },
            "Topic": {
                S: topic
            }
        },
        TableName: process.env.SUBTABLE
    };

    let response = await dynamodb.deleteItem(deleteParams).promise();
    console.log(response);


};

const removeSubscription = async (subs) => {
    console.log(`remove ${JSON.stringify(subs)}`);
};

const unsubscribeTopic = async(river, topic, subs) => {
    if(subs.topics && subs.topics.filter(t => t == topic).length == 0) {
        console.log('nothing to unsubscribe');
        return;
    }

    if(subs.topics && subs.topics.length > 1) {
        await removeTopicFromFilterPolicy(river, topic, subs);
    } else {
        await removeSubscription(subs);
    }
}

const processUnsubscribe = async(cmd) => {
    let river = cmd.commandArgs.river;
    let topic = cmd.commandArgs.topic;

    console.log(`unsubscribe ${river} to ${topic}`);

    let subscriptions =  await getTopicSubsForRiver(river);
    console.log(`subs for river: ${JSON.stringify(subscriptions)}`);

    let topics = subscriptions['topics'];
    if(topics == undefined) {
        console.log(`no subscriptions for ${river}`);
        return;
    }

    await unsubscribeTopic(river, topic, subscriptions);
}

module.exports = {
    processUnsubscribe
};