const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const connect = await mongoose.connect(process.env.MONGO_URL);
        console.log(`MongoDB Connected: ${connect.connection.host}`);
    } catch (error) {
        console.error(`Error in db: ${error.message}`);
        process.exit(1); // Shuts down the server if connection fails
    }
};

module.exports = connectDB;