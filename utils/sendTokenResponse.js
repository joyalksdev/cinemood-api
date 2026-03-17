const jwt = require("jsonwebtoken");

const sendTokenResponse = (user, statusCode, res) => {
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
        onboarded: user.onboarded,
        watchlist: user.watchlist,
        genres: user.genres || [],
        language: user.language || "en",
      },
    });
};

module.exports = sendTokenResponse;