const getTopicSubsForRiver = require('./common').getTopicSubsForRiver;

const handler = async (event) => {
    console.log(`event: ${JSON.stringify(event)}`);

    let river = event['river'];
    if(river == undefined) {
        throw new Error('Required property river not present in input');
    }

    let subs = [];
    let subscriptionDeets = await getTopicSubsForRiver(river);
    console.log(`subscription details: ${JSON.stringify(subscriptionDeets)}`);
    if(!subscriptionDeets || !subscriptionDeets.topics) {
        return subs;
    }

    return subscriptionDeets.topics;
}

module.exports = {
    handler
};