const jwt = require("jsonwebtoken");

const sendTokenResponse = async(user, statusCode, res) => {
  
  try {
    user.lastActive = Date.now();
    await user.save({ validateBeforeSave: false }); 
    
    // 2. Log the successful authentication
    const action = statusCode === 201 ? "Account Registered" : "User Logged In";
    logActivity(user._id, action, "auth");
  } catch (err) {
    console.error("Activity Update Error:", err.message);
  }

  //  Create token
  const token = jwt.sign({ id: user._id }, process.env.secret_key, {
    expiresIn: "7d",
  });

  // Cookie settings
    const cookieOptions = {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: true, 
        sameSite: "None", 
    };

  // Send response
  res
    .status(statusCode)
    .cookie("token", token, cookieOptions)
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