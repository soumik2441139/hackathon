
const { MongoClient } = require('mongodb');
const IORedis = require('ioredis');
const dotenv = require('dotenv');

// Load .env from current dir (opushire-backend)
dotenv.config();

async function checkRedis(name, host, port, password, tls) {
    if (!host) {
        console.error(`❌ ${name}: Configuration missing (HOST is undefined)`);
        return;
    }
    console.log(`[${name}] Checking ${host}:${port}...`);
    const redis = new IORedis({
        host,
        port: parseInt(port),
        password,
        tls: tls === 'true' ? { rejectUnauthorized: false } : undefined,
        maxRetriesPerRequest: null,
        connectTimeout: 5000
    });

    try {
        await redis.ping();
        console.log(`✅ ${name} REACHABLE`);
    } catch (err) {
        console.error(`❌ ${name} UNREACHABLE: ${err.message}`);
    } finally {
        await redis.disconnect();
    }
}

async function checkMongo(uri) {
    if (!uri) {
        console.error(`❌ MONGODB: Configuration missing (URI is undefined)`);
        return;
    }
    console.log(`[MONGODB] Checking connection...`);
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    try {
        await client.connect();
        await client.db().admin().ping();
        console.log(`✅ MONGODB REACHABLE`);
    } catch (err) {
        console.error(`❌ MONGODB UNREACHABLE: ${err.message}`);
    } finally {
        await client.close();
    }
}

async function run() {
    console.log("--- SYSTEM HEALTH AUDIT ---\n");
    
    // 1. Primary Redis
    await checkRedis(
        'PRIMARY REDIS', 
        process.env.REDIS_HOST, 
        process.env.REDIS_PORT, 
        process.env.REDIS_PASSWORD, 
        process.env.REDIS_TLS
    );

    // 2. Secondary Redis
    await checkRedis(
        'SECONDARY REDIS', 
        process.env.SECONDARY_REDIS_HOST, 
        process.env.SECONDARY_REDIS_PORT, 
        process.env.SECONDARY_REDIS_PASSWORD, 
        process.env.SECONDARY_REDIS_TLS
    );

    // 3. MongoDB
    await checkMongo(process.env.MONGODB_URI);
    
    console.log("\n--- AUDIT COMPLETE ---");
}

run();
