
const AWS = require('aws-sdk');


var proxy = require('proxy-agent');    
AWS.config.update({
    httpOptions: { agent: proxy(process.env.https_proxy) }
});

var kinesis = new AWS.Kinesis();
var lambda = new AWS.Lambda();

const writeToRapids = async (streamName, source, event) => {
    //console.log(`write ${JSON.stringify(event)} to rapids`);
    let params = {
        Data: JSON.stringify(event),
        PartitionKey: source,
        StreamName: streamName
    }

    return kinesis.putRecord(params).promise();
};

const getMessageBatch = async (stage, river) => {
    
    let params = {
        FunctionName: `BatchForRiver-${stage}`,
        Payload: JSON.stringify({river: river})
    }

    let result = await lambda.invoke(params).promise();
    let parsed = JSON.parse(result['Payload']);

    return parsed;
}



const listSubscriptions = async (stage, river) => {
    let params = {
        FunctionName: `ListSubs-${stage}`,
        Payload: JSON.stringify({river: river})
    }

    let result = await lambda.invoke(params).promise();
    let parsed = JSON.parse(result['Payload']);

    return parsed;
}

const listTopics = async(stage) => {
    let params = {
        FunctionName: `Advertise-${stage}`,
        Payload: JSON.stringify({})
    }

    let result = await lambda.invoke(params).promise();
    let parsed = JSON.parse(result['Payload']);

    return parsed;
}

module.exports = {
    writeToRapids,
    getMessageBatch,
    listSubscriptions,
    listTopics
};

