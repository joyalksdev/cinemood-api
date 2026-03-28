const jwt = require("jsonwebtoken");

const sendTokenResponse = async(user, statusCode, res) => {
  
  try {
    // 1. Update the user's presence timestamp
    user.lastActive = Date.now();
    // We skip validation here because we are only updating one internal field
    await user.save({ validateBeforeSave: false }); 
    
    // 2. Log the successful authentication for the Admin Dashboard
    const action = statusCode === 201 ? "Account Registered" : "User Logged In";
    logActivity(user._id, action, "auth");
  } catch (err) {
    console.error("Activity Update Error:", err.message);
  }

  // 3. Create the JWT token containing the User ID
  const token = jwt.sign({ id: user._id }, process.env.secret_key, {
    expiresIn: "7d", // Valid for one week
  });

  // 4. Secure Cookie Settings
  const cookieOptions = {
    // Expires in 7 days to match the token
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true, // Prevents Cross-Site Scripting (XSS) attacks
    secure: true,   // Requires HTTPS
    sameSite: "None", // Crucial for cross-origin requests (e.g., Vercel to Render)
  };

  // 5. Final Response
  res
    .status(statusCode)
    .cookie("token", token, cookieOptions) // Attach the cookie to the browser
    .json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role, 
        onboarded: user.onboarded,
        watchlist: user.watchlist,
        genres: user.genres || [],
        language: user.language || "en",
      },
    });
};

module.exports = sendTokenResponse;