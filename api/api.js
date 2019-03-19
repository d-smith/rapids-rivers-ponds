
const AWS = require('aws-sdk');


var proxy = require('proxy-agent');    
AWS.config.update({
    httpOptions: { agent: proxy(process.env.https_proxy) }
});

var kinesis = new AWS.Kinesis();

const writeToRapids = async (streamName, source, event) => {
    let params = {
        Data: JSON.stringify(event),
        PartitionKey: source,
        StreamName: streamName
    }

    return kinesis.putRecord(params).promise();
};


// Create a river for the consumer if it is their first subscription,
// otherwise record the desire to recieve messages.
const subscribeToService = async (consumer, service) => {

}

// Register a producer of events.
const registerProducer= async(service) => {

}

// List producers
const listProducers = async () => {

}

//List consumers
const listConsumers = async () => {

}

module.exports = {
    writeToRapids,
    subscribeToService,
    registerProducer,
    listProducers,
    listConsumers
};

