const dotenv = require("dotenv");
dotenv.config()

const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require('cors');
const connectDB = require("./config/dbConection");

const authRoutes = require('./routes/authRoutes')
const userRoutes = require('./routes/userRoutes');
const watchlistRoutes = require('./routes/watchlistRoutes')
const movieRoutes = require('./routes/movieRoutes');
const reviewRoutes = require('./routes/reviewRoutes')
const aiRoutes = require('./routes/aiRoutes')
const adminRoutes = require("./routes/adminRoutes");
const supportRoutes = require('./routes/supportRoutes');
const updateLastActive = require("./middleware/updateActive");
const { errorHandler } = require("./middleware/errorMiddleware");

// establishes the connection to mongodb before the app starts listening
connectDB()

const app = express()

app.use(express.json())

app.use(cookieParser())

// global middleware to track user activity on every incoming request
app.use(updateLastActive)

app.use(cors({
    origin: process.env.FRONTEND_URL, 
    credentials: true, // required to accept jwt cookies from the frontend
}));

app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);
app.use("/api/admin", adminRoutes);
app.use('/api/profile', userRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/support', supportRoutes);

// catches any errors thrown in the routes to keep the process from crashing
app.use(errorHandler)

app.get('/', (req,res)=>{
    res.send('API Running fine...')
})

const port = process.env.PORT || 4000

app.listen(port, ()=>{
    console.log(`Server running Successfully at localhost:${port}`)
})