
let parseInput = (recordData) => {
    let buff = new Buffer(recordData, 'base64'); 
    let text = buff.toString('utf-8');

    return JSON.parse(text);
}

let dispatchCommand = (cmd) => {
    switch(cmd.command) {
        case 'subscribe':
            processSubscribe(cmd);
            break;
        default:
            console.log(`Command not supported: ${JSON.stringify(cmd)}`);
            break;
    }
}

let processSubscribe = (cmd) => {
    console.log(JSON.stringify(cmd));
    let river = cmd.commandArgs.river;
    let topic = cmd.commandArgs.topic;

    console.log(`subscribe ${river} to ${topic}`);
    console.log('check river for stage ' + process.env.STAGE);
} 

const handler = async(event, context) => {
    console.log(JSON.stringify(event));
    console.log(JSON.stringify(context));

    for(rec of event['Records']) {
        try {
            parsed = parseInput(rec.kinesis.data);
            dispatchCommand(parsed);
        } catch(e) {
            console.log(e); //This throws away the record - might want to write it to a DLQ
        }
    }
}

module.exports = {
    handler
};