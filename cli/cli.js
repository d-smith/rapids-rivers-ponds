const vorpal = require('vorpal')();

const writeToRapids = require('../api/api.js').writeToRapids;

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

    let res = await writeToRapids(streamName, args.source, event);
    console.log(res);

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