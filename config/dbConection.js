const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const connect = await mongoose.connect(process.env.MONGO_URL);
        console.log(`MongoDB Connected: ${connect.connection.host}`);
    } catch (error) {
        console.error(`Error in db: ${error.message}`);
        // kills the process immediately since the app can't function without the database
        process.exit(1); 
    }
};

module.exports = connectDB;