const mongoose = require('mongoose');
const config = require('./config');
const db = {};

db.connect = async() => {
    try {
        await mongoose.connect(config.MONGODB_URI)
        console.log("Database connected successfully!")
        console.log(`📊 Connected to database: ${mongoose.connection.name}`)    
    } catch (error) {
        console.log("Database connection error!", error)
    }
}

db.disconnect = async () => {
    try {
        await mongoose.connection.close();
        console.log("Database disconnectd!")
        
    } catch (error) {
        console.log("Database disconnection failed!", error)
    }
}

module.exports = db;