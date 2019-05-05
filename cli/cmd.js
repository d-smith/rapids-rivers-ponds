const vorpal = require('vorpal')();

const writeToRapids = require('../api/api.js').writeToRapids;
const getMessageBatch = require('../api/api.js').getMessageBatch;
var program = require('commander');
var chance = require('chance').Chance()

var streamName;
var controlStream;
var stage;

const dispatchSend = async (args, callback) => {
    let event = {
        eventType: args.event,
        eventDomain: args.source,
        payload: JSON.parse(args.data),
        timestamp: new Date().toISOString(),
        eventId: chance.guid({version: 4})
    };

    let res = await writeToRapids(streamName, args.source, event);
    //console.log(res);

    callback();
}

const dispatchMessageBatch = async(args, callback) => {
    let res = await getMessageBatch(stage, args.river);
    console.log(res);
    callback();
}

const dispatchSubscribe = async (args, callback) => {
    //console.log(`send control event ${JSON.stringify(args)}`);
    let event = {
        command: 'subscribe',
        commandArgs: {
            river: args.river,
            topic: args.topic
        }
    };

    let res = await writeToRapids(controlStream, args.river, event);
    //console.log(res);

    callback();
}

const dispatchUnsubscribe = async (args, callback) => {
    //console.log(`send control event ${JSON.stringify(args)}`);
    let event = {
        command: 'unsubscribe',
        commandArgs: {
            river: args.river,
            topic: args.topic
        }
    };

    let res = await writeToRapids(controlStream, args.river, event);
    //console.log(res);

    callback();
}

const dispatchListSubs = async (args, callback) => {
    console.log('list subs');
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
    .option('-s, --stage <stage>', 'Stage name, e.g. dev')
    .parse(process.argv);

vorpal
    .command('send <event> <source> [data]', 'Publish event with optional data')
    .action(dispatchSend);

vorpal
    .command('subscribe <river> <topic>', 'Subscribe a river to a topic')
    .action(dispatchSubscribe);

vorpal
    .command('readfrom <river>', 'Get a batch of messages')
    .action(dispatchMessageBatch);

vorpal
    .command('listsubs <river>', 'List subscriptions for a river')
    .action(dispatchListSubs);


vorpal
    .command('unsubscribe <river> <topic>', 'Remove a topic from a river subscription')
    .action(dispatchUnsubscribe);

streamName = program.rapids;
controlStream = program.controlStream;
stage = program.stage;


if(typeof streamName === 'undefined') {
    console.log('rapids stream name not given');
    process.exit(1);
}

if(typeof controlStream === 'undefined') {
    console.log('control stream name not given');
    process.exit(1);
}

if(typeof stage === 'undefined') {
    console.log('stage not specified - default to dev');
    stage = 'dev';
}

vorpal
    .delimiter('cmd >')
    .show();