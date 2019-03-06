const vorpal = require('vorpal')();

const AWS = require('aws-sdk');


var proxy = require('proxy-agent');    
AWS.config.update({
    httpOptions: { agent: proxy(process.env.https_proxy) }
});

var kinesis = new AWS.Kinesis();

var streamName;

const dispatchSend = async (args, callback) => {
    if(streamName == undefined) {
        vorpal.log('use the set stream command before dispatching');
        callback();
        return;
    }

    let event = {
        eventDomain: args.sender,
        payload: args.data
    };

    let params = {
        Data: JSON.stringify(event),
        PartitionKey: args.source,
        StreamName: streamName
    }



    let res = await kinesis.putRecord(params).promise();
    console.log(reg);

    console.log(args);
    callback();
}

const setStream = async(args, callback) => {
    console.log(`stream is ${args.stream}`);
    streamName = args.stream;
    callback();
}

vorpal
    .command('send <event> <source> [data]', 'Publish event with optional data')
    .action(dispatchSend);

    vorpal
    .command('set stream <stream>', 'Set name of stream to write events to')
    .action(setStream);

vorpal
    .delimiter('cmd >')
    .show();