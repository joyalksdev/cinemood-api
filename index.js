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
const updateLastActive = require("./middleware/updateActive");
const { errorHandler } = require("./middleware/errorMiddleware");

connectDB()

const app = express()

app.use(express.json())

app.use(cookieParser())

app.use(updateLastActive)

app.use(cors({
    origin: process.env.FRONTEND_URL, 
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);
app.use("/api/admin", adminRoutes);
app.use('/api/profile', userRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/reviews', reviewRoutes);

app.use(errorHandler)

app.get('/', (req,res)=>{
    res.send('API Running fine...')
})

const port = process.env.PORT || 4000

app.listen(port, ()=>{
    console.log(`Server running Successfully at localhost:${port}`)
})
