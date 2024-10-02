import { createClient } from 'redis';
let instance = null;
//singleton
class TempBase {
    constructor() {
        if (TempBase.instance) {
            return TempBase.instance;
        }
        TempBase.instance = this;
        this.uploadComplete = false;
        this.tokenBuckets = {};
    }
    // other methods

    static async getInstance() {
        if (!instance) {
            instance = new TempBase();
            instance.redisClient = await createClient({
                password: process.env.REDIS_PASSWORD,
                socket: {
                    host: process.env.REDIS_HOST,
                    port: process.env.REDIS_PORT
                }
            }).on('error', err => console.log('Redis Client Error', err))
                .connect();
        }
        return instance;
    }
}


export default TempBase;