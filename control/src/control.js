const handler = async(event, context) => {
    console.log(JSON.stringify(event));
    console.log(JSON.stringify(context));
}

module.exports = {
    handler
};