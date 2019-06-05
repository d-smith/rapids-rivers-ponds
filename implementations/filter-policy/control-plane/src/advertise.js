const AWS = require('aws-sdk');
var dynamodb = new AWS.DynamoDB();


const handler = async (event) => {
    console.log(`advertise invoked with event ${JSON.stringify(event)}`);

    let params = {
        TableName: process.env.TOPICS_TABLE
    };

    let response = await dynamodb.scan(params).promise();
    console.log(response);

    let items = response['Items'];
    if(items.length == 0) {
        return [];
    }

    return items.map(i => i['Topic']['S']);
}


const processAdvertise = async (cmd) => {
    console.log(`processAdvertise ${JSON.stringify(cmd)}`);
    if(cmd.commandArgs == undefined || cmd.commandArgs.topic == undefined) {
        console.log('Command commandArgs propery must be an object with a topic property');
        return;
    }

    let topicToAdvertise = cmd.commandArgs.topic;
    console.log(`Add ${topicToAdvertise} to advertised topics.`);

    console.log(`table name is ${process.env.TOPICS_TABLE}`);
    let params = {
        Item: {
            "Topic": {
                S: topicToAdvertise
            }
        },
        TableName: process.env.TOPICS_TABLE
    }

    let response = await dynamodb.putItem(params).promise();
    console.log(response);

}

module.exports = {
    handler,
    processAdvertise
};