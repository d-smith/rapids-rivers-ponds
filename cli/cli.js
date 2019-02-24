const vorpal = require('vorpal')();



const dispatchSend = async (args, callback) => {
    console.log(args);
    callback();
}

vorpal
    .command('send <event> [data]', 'Publish event with optional data')
    .action(dispatchSend);

vorpal
    .delimiter('cmd >')
    .show();