const mongoose = require('mongoose');
const config = require('config');
const { process_params } = require('express/lib/router');
// Get database URL
const db = config.get('mongoURI');

// Connect to DB
const connectDB = async () => {
    try {
        await mongoose.connect(db);
        console.log('MongoDB Connected...');
    } catch(err) {
        console.error(err.message);
        // Exit process with failure
        process.exit(1);
    }
}

module.exports = connectDB;