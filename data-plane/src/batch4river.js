const AWS = require('aws-sdk');
var sqs = new AWS.SQS();

const formRiverQName = (river) => {
    return `${river}${process.env.STAGE}`;
}

const handler = async(event) => {
    console.log(JSON.stringify(event));
    let queueName = formRiverQName(event.river);
    let queueUrlForDelete = '';

    let receieveResponse = await sqs.getQueueUrl({
        QueueName: queueName
    }).promise().then(result => {
        queueUrlForDelete = result['QueueUrl'];
        return sqs.receiveMessage({
            QueueUrl: result['QueueUrl'],
            MaxNumberOfMessages: 3, //because reasons,
            WaitTimeSeconds: 5
        }).promise();
    }, reason => {
        throw new Error(reason);
    });
    
    console.log(receieveResponse);
    if(receieveResponse['Messages'] == undefined) {
        console.log('No messages available');
        return [];
    }
    
    let messages = receieveResponse['Messages'];
    let deleteHandles = messages.map(m => { return {Id: m['MessageId'], ReceiptHandle: m['ReceiptHandle']};});
    console.log(queueUrlForDelete);
    
    let deleteResponse = await sqs.deleteMessageBatch({
        Entries: deleteHandles,
        QueueUrl: queueUrlForDelete
    }).promise();
    console.log(deleteResponse);
    
    return messages.map(m => JSON.parse(m['Body']));

        
}

module.exports = {
    handler
};