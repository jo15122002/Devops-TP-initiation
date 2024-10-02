// Imports the Google Cloud client library
import { PubSub } from '@google-cloud/pubsub';

import * as photoModel from './photo_model.js';

import { Storage } from '@google-cloud/storage';
import fetch from 'node-fetch';
import * as ZipStream from 'zip-stream';

import TempBase from './TempBase.js';

import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

// Creates a client; cache this for further use
const pubSubClient = new PubSub();

const firebaseApp = initializeApp({
    credential: applicationDefault(),
    databaseURL: process.env.FIREBASE_DATABASE_URL
});

function listenForMessages(subscriptionNameOrId) {
    console.log(`Listening for messages on ${subscriptionNameOrId}`);
    // References an existing subscription; if you are unsure if the
    // subscription will exist, try the optimisticSubscribe sample.
    const subscription = pubSubClient.subscription(subscriptionNameOrId);

    // Create an event handler to handle messages
    const messageHandler = async message => {
        const zipDate = Date.now();

        const db = getDatabase();
        const ref = db.ref(process.env.FIREBASE_DATABASE_REF);
        const zipDateRef = ref.child(zipDate);

        const storage = new Storage();
        const file = await storage.bucket(process.env.BUCKET_NAME).file('images_joyce' + zipDate + '.zip');
        const stream = file.createWriteStream({
            metadata: {
                contentType: 'application/zip',
                cacheControl: 'private'
            },
            resumable: false
        });

        // get photos from flickr public feed api

        console.log("message : " + JSON.parse(message.data).tags);

        photoModel
            .getFlickrPhotos(JSON.parse(message.data).tags, 'all')
            .then(async photos => {
                TempBase.uploadComplete = false;

                var zip = ZipStream.default();
                zip.pipe(stream);
                //console.log(photos);

                var queue = [];
                photos.forEach((element, index) => {
                    queue.push({ name: `${index}.jpg`, url: element });
                });
                //console.log(queue);

                async function addNextFile() {
                    console.log("entrée dans addNextFile, nb queue : " + queue.length);
                    if (queue.length === 0) {
                        console.log("fin de la queue");
                        zip.finalize();
                        return;
                    }

                    var file = queue.shift();
                    //console.log("file : " + JSON.stringify(file?.url?.media?.b));
                    const arrayBuffer = await (await fetch(file.url.media.b)).arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    zip.entry(buffer, { name: file.name }, function (err) {

                        if (err) {
                            console.error(err);
                            return;
                        }

                        addNextFile();
                    });
                }

                await addNextFile();
            })
            .catch(error => {
                console.log(error);
            });

        await new Promise((resolve, reject) => {
            stream.on('error', (err) => {
                reject(err);
            });
            stream.on('finish', () => {
                resolve('Ok');
            });
        });
        // "Ack" (acknowledge receipt of) the message
        message.ack();
        TempBase.uploadComplete = true;

        //save the image path in the database
        zipDateRef.set({
            path: 'images_joyce' + zipDate + '.zip',
            tags: JSON.parse(message.data).tags
        });

        const options = {
            action: 'read',
            expires: Date.now() + 1000 * 60 * 60 // 1 hour
        };
        const signedUrls = await storage.bucket(process.env.BUCKET_NAME).file('images_joyce.zip').getSignedUrl(options);
        console.log(`Signed URL: ${signedUrls[0]}`);
    };

    // Listen for new messages until timeout is hit
    subscription.on('message', messageHandler);

    // Wait a while for the subscription to run. (Part of the sample only.)
    // setTimeout(() => {
    //     subscription.removeListener('message', messageHandler);
    //     console.log(`${messageCount} message(s) received.`);
    // }, timeout * 1000);
}

function getUrl(path) {
    const storage = new Storage();
    const options = {
        action: 'read',
        expires: Date.now() + 1000 * 60 * 60 // 1 hour
    };
    return storage.bucket(process.env.BUCKET_NAME).file(path).getSignedUrl(options);
}

function main(
    subscriptionNameOrId = process.env.TOPIC_SUBSCRIPTION
) {
    console.log("main");
    listenForMessages(subscriptionNameOrId);
}

main();

export { getUrl };

