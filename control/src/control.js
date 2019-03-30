
let parseInput = (recordData) => {
    let buff = new Buffer(recordData, 'base64'); 
    let text = buff.toString('utf-8');

    return JSON.parse(text);
}

const handler = async(event, context) => {
    console.log(JSON.stringify(event));
    console.log(JSON.stringify(context));

    for(rec of event['Records']) {
        try {
            parsed = parseInput(rec.kinesis.data);
            console.log(parsed);
        } catch(e) {
            console.log(e); //This throws away the record - might want to write it to a DLQ
        }
    }
}

module.exports = {
    handler
};