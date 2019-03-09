
const AWS = require('aws-sdk');


var proxy = require('proxy-agent');    
AWS.config.update({
    httpOptions: { agent: proxy(process.env.https_proxy) }
});

var kinesis = new AWS.Kinesis();

var streamName;

const writeToRapids = async (streamName, source, event) => {
    let params = {
        Data: JSON.stringify(event),
        PartitionKey: source,
        StreamName: streamName
    }

    return kinesis.putRecord(params).promise();
};

module.exports = {
    writeToRapids
};

