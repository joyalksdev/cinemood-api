const dotenv = require("dotenv");
dotenv.config()

const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require('cors');
const connectDB = require("./config/dbConection");
const path = require('path');

// routes
const authRoutes = require('./routes/authRoutes')
const userRoutes = require('./routes/userRoutes');
const watchlistRoutes = require('./routes/watchlistRoutes')
const movieRoutes = require('./routes/movieRoutes');
const reviewRoutes = require('./routes/reviewRoutes')
const aiRoutes = require('./routes/aiRoutes')
const adminRoutes = require("./routes/adminRoutes");
const supportRoutes = require('./routes/supportRoutes');

// middleware
const updateLastActive = require("./middleware/updateActive");
const { errorHandler } = require("./middleware/errorMiddleware");
const { globalLimiter } = require("./middleware/rateLimiter");

// connect to db
connectDB()

const app = express()

// essential for render/vercel to get real IP
app.set('trust proxy', 1);

app.use(express.json())
app.use(cookieParser())

// cors setup for cookies
app.use(cors({
    origin: process.env.FRONTEND_URL, 
    credentials: true, 
}));

// security and activity tracking
app.use(globalLimiter);
app.use(updateLastActive);

// api endpoints
app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);
app.use("/api/admin", adminRoutes);
app.use('/api/profile', userRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/support', supportRoutes);

// error handling always goes last
app.use(errorHandler)

// Server running check - sends the custom styled html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const port = process.env.PORT || 4000

app.listen(port, ()=>{
    console.log(`Server running Successfully at localhost:${port}`)
})