const AWS = require('aws-sdk');
var sqs = new AWS.SQS();

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

let createRiver = async (river) => {
    let riverQName = formRiverQName(river);
    console.log(`create queue ${riverQName} for river ${river}`);
}

let processSubscribe = async (cmd) => {
    console.log(JSON.stringify(cmd));
    let river = cmd.commandArgs.river;
    let topic = cmd.commandArgs.topic;

    console.log(`subscribe ${river} to ${topic}`);
    let riverExists = await hasRiver(river);
    if(!riverExists) {
        console.log('create river...');
        await createRiver(river);
    }

    console.log('check river for stage ' + process.env.STAGE);
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