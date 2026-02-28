"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
let isConnected = false;
const connectWithRetry = async () => {
    try {
        const conn = await mongoose_1.default.connect(env_1.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 15000,
            socketTimeoutMS: 45000,
        });
        isConnected = true;
        console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    }
    catch (error) {
        console.error('❌ MongoDB connection failed:', error?.message || error);
        console.log('🔄 Retrying MongoDB connection in 5 seconds...');
        setTimeout(connectWithRetry, 5000);
    }
};
const connectDB = async () => {
    if (isConnected)
        return;
    // Connect in background — don't block server startup
    connectWithRetry();
};
exports.connectDB = connectDB;
mongoose_1.default.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected');
    isConnected = false;
});
//# sourceMappingURL=db.js.map