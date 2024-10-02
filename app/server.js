import 'dotenv/config';
import ejs from 'ejs';
import express from 'express';
import path from 'path';
import favicon from 'serve-favicon';
import { fileURLToPath } from 'url';
import TempBase from './TempBase.js';
import './worker.js';

const app = express();
const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

//middleware token bucket
app.use(async (req, res, next) => {
    let requestDate = Date.now();
    var ip = req.headers['x-forwarded-for'] ||
        req.socket.remoteAddress ||
        null;

    let redisClient = (await TempBase.getInstance()).redisClient;

    // create token bucket for ip if it doesn't exist
    if (!(await TempBase.getInstance()).tokenBuckets[ip]) {
        (await TempBase.getInstance()).tokenBuckets[ip] = { 'ip': ip, 'date': requestDate, 'tokens': 15 };
        redisClient.set(ip, JSON.stringify((await TempBase.getInstance()).tokenBuckets[ip]));
    }

    // get token bucket from redis
    await redisClient.get(ip, async (err, reply) => {
        if (err) {
            console.log(err);
        }
        if (reply) {
            (await TempBase.getInstance()).tokenBuckets[ip] = JSON.parse(reply);
        }
    });

    // refill token bucket
    let elapsedTime = requestDate - (await TempBase.getInstance()).tokenBuckets[ip].date;
    (await TempBase.getInstance()).tokenBuckets[ip].date = requestDate;

    let tokens = Math.floor(elapsedTime / 1000) * process.env.REFILL_TIME_PER_TOKENS_IN_SECONDS;
    (await TempBase.getInstance()).tokenBuckets[ip].tokens = Math.min((await TempBase.getInstance()).tokenBuckets[ip].tokens + tokens, process.env.BUCKET_SIZE);

    console.log('ip: ' + ip + ' tokens: ' + JSON.stringify((await TempBase.getInstance()).tokenBuckets[ip]));

    // check if there are enough tokens
    if ((await TempBase.getInstance()).tokenBuckets[ip].tokens < process.env.REQUEST_COST) {
        return res.status(429).send({ error: 'Too many requests: not enough tokens' });
    }

    // store new token bucket in redis
    (await TempBase.getInstance()).tokenBuckets[ip].tokens -= process.env.REQUEST_COST;
    redisClient
        .set(ip, JSON.stringify((await TempBase.getInstance()).tokenBuckets[ip]));

    next();
});

// public assets
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, 'public/images', 'favicon.ico')));
app.use('/coverage', express.static(path.join(__dirname, '..', 'coverage')));

// ejs for view templates
app.engine('.html', ejs.__express);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');

// load route
import * as routes from './route.js';
routes.route(app);

// server
const port = process.env.PORT || 3000;
app.server = app.listen(port);
console.log(`listening on port ${port}`);

export { app };

