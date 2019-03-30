const vorpal = require('vorpal')();

const writeToRapids = require('../api/api.js').writeToRapids;
var program = require('commander');

var streamName;
var controlStream;

const dispatchSend = async (args, callback) => {
    let event = {
        eventDomain: args.sender,
        payload: args.data
    };

    let res = await writeToRapids(streamName, args.source, event);
    console.log(res);

    callback();
}

const dispatchSubscribe = async (args, callback) => {
    console.log(`send control event ${JSON.stringify(args)}`);
    let event = {
        command: 'subscribe',
        commandArgs: {
            river: args.river,
            topic: args.topic
        }
    };

    let res = await writeToRapids(streamName, args.river, event);
    console.log(res);

    callback();
}

const setStream = async(args, callback) => {
    console.log(`stream is ${args.stream}`);
    streamName = args.stream;
    callback();
}

program
    .version('0.0.1')
    .option('-c, --control-stream <controlStream>', 'Control stream name')
    .option('-r, --rapids <rapids>', 'Rapids stream name')
    .parse(process.argv);

vorpal
    .command('send <event> <source> [data]', 'Publish event with optional data')
    .action(dispatchSend);

vorpal
    .command('subscribe <river> <topic>', 'Subscribe a river to a topic')
    .action(dispatchSubscribe);

streamName = program.rapids;
controlStream = program.controlStream;


if(typeof streamName === 'undefined') {
    console.log('rapids stream name not given');
    process.exit(1);
}

if(typeof controlStream === 'undefined') {
    console.log('control stream name not given');
    process.exit(1);
}

vorpal
    .delimiter('cmd >')
    .show();