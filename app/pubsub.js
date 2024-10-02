// Imports the Google Cloud client library
import { PubSub } from "@google-cloud/pubsub";

async function quickstart(
    tags,
    projectId, // Your Google Cloud Platform project ID
    topicNameOrId // Name for the new topic to create
) {
    // Instantiates a client
    const pubsub = new PubSub({ projectId });

    // Creates a new topic
    const topic = await pubsub.topic(topicNameOrId);
    console.log(`Topic ${topic.name} retrieved.`);


    // Send a message to the topic
    console.log(`Sending message to topic`);
    await topic.publishMessage({ data: Buffer.from(JSON.stringify({ 'tags': tags, })) });
    console.log(`Message published.`);
}

export { quickstart };

