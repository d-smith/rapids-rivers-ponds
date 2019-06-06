const AWS = require('aws-sdk');
var sqs = new AWS.SQS();
var dynamodb = new AWS.DynamoDB();
var sns = new AWS.SNS();


const getTopicSubsForRiver = async (river) => {
    console.log('query db for subs');
    let params = {
        ExpressionAttributeValues: {
            ":sv": {
                S: river
            }
        },
        KeyConditionExpression: "Subscriber = :sv",
        TableName: process.env.SUBTABLE
    };

    let response = await dynamodb.query(params).promise();
    console.log('db query returns')
    console.log(JSON.stringify(response));
    let items = response["Items"];

    let topics = items.map(i => {return i["Topic"]["S"]});

    return {topics: topics};
}

module.exports = {
    getTopicSubsForRiver
};