# 🎬 CineMood Backend - Neural Engine

The **CineMood Backend** is a high-performance Node.js/Express API designed to power an AI-integrated movie recommendation platform.

It leverages **Google Gemini AI** for personalized *"Neural"* suggestions and **TMDB** for real-time cinematic data.

---

## 🚀 Core Features

### 🧠 Neural AI Recommendations
- Integration with Google Gemini AI
- Suggests movies based on:
  - User mood
  - Language preferences
  - Watchlist history

### 👤 Advanced User Management
- Full authentication system using JWT & Bcrypt
- Features include:
  - User onboarding
  - Secure login
  - Password recovery

### ⭐ Community Reviews
- MongoDB-based rating & review system
- Built-in moderation:
  - Report system
  - Flagging inappropriate content

### 🔔 Smart Notifications
- Tiered notification system:
  - Personalized alerts
  - Global announcements

### 🛡️ Admin Control Center
- Admin-only routes for:
  - User banning
  - Report handling
  - Activity monitoring

### 🔒 Security Suite
- Multi-layer rate limiting:
  - Auth limiter
  - Support limiter
  - Global limiter
- HTTP-only cookie-based sessions

---

## 🛠️ Tech Stack

| Category       | Technology |
|---------------|-----------|
| Runtime       | Node.js |
| Framework     | Express.js |
| Database      | MongoDB (Mongoose) |
| AI Engine     | Google Gemini |
| Security      | JWT, Bcrypt, Express-Rate-Limit |
| Communication | Nodemailer (Gmail SMTP) |

---

## 📂 Architecture Overview
├── controllers/ # Business logic (AI, Auth, Movies, Admin, etc.)
├── models/ # Mongoose schemas (User, Review, Notification, Activity)
├── routes/ # Express router definitions
├── middleware/ # Auth, Error handling, Rate limiters
├── utils/ # Shared utilities (Email, Logger, Token Response)
└── index.js # Entry point


---

## 🔒 Security & Middleware

| Middleware      | Purpose |
|----------------|--------|
| Protect        | Verifies JWT from HTTP-only cookies |
| Admin          | Restricts access to admin users |
| AuthLimiter    | Prevents brute-force attacks (5 attempts/hour) |
| SupportLimiter | Prevents email spam |
| ErrorHandler   | Standardized JSON error responses |

---

## 📡 API Endpoints

### 🔐 Authentication
- `POST /api/auth/register` → Create account  
- `POST /api/auth/login` → Login (cookie session)  
- `POST /api/auth/forgotpassword` → Password recovery  

### 🎥 Neural & Movies
- `POST /api/ai/process` → AI movie recommendations  
- `GET /api/movies/personalized` → Personalized movies  
- `GET /api/movies/trending` → Trending movies (Public)  

### 👥 Community & User
- `POST /api/reviews` → Add review  
- `GET /api/user/me` → Get user profile  
- `GET /api/user/notifications` → Get notifications  

---

## 🛠️ Environment Setup

Create a `.env` file in the root directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
SECRET_KEY=your_jwt_secret
TMDB_API_KEY=your_tmdb_key
GEMINI_API_KEY=your_google_ai_key
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_16_char_app_password
NODE_ENV=development
--

📊 Activity Tracking

CineMood includes a built-in Activity Logger that tracks:

User logins
Searches
Reviews & interactions

⚡ Runs asynchronously to avoid blocking performance
📈 Data is used in the Admin Dashboard for analytics

⚡ Getting Started

# Install dependencies
npm install

# Run server
npm run dev
dev
🤝 Contributing

Pull requests are welcome!
For major changes, please open an issue first.

📄 License

This project is licensed under the MIT License.

💡 Author

Built with ❤️ by Joyal
