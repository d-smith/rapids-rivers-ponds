const AWS = require('aws-sdk');
var sqs = new AWS.SQS();
var dynamodb = new AWS.DynamoDB();
var sns = new AWS.SNS();

const getTopicSubsForRiver = require('./common').getTopicSubsForRiver;

const processUnsubscribe = async(cmd) => {
    let river = cmd.commandArgs.river;
    let topic = cmd.commandArgs.topic;

    console.log(`unsubscribe ${river} to ${topic}`);

    let topicSubResults =  await getTopicSubsForRiver(river);
    console.log(`subs for river: ${JSON.stringify(topicSubResults)}`);
}

module.exports = {
    processUnsubscribe
};