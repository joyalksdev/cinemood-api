const User = require("../models/user");
const bcrypt = require("bcrypt");
const sendTokenResponse = require("../utils/sendTokenResponse");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

const registerUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide email and password" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    // hashes the password before saving so we never store plain text in the db
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({ email, password: hashedPassword });

    // helper function that creates a jwt, sets a cookie, and sends the response
    await sendTokenResponse(user, 201, res);

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide email and password" });
    }

    // explicitly selects hidden fields (password/role) needed for validation logic
    const user = await User.findOne({ email }).select("+password +role"); 

    // gatekeeper: prevents login if the admin has flagged the account
    if (user && (user.status === 'banned' || user.status === 'suspended')) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. Your account is currently ${user.status}.` 
      });
    }

    // compares the provided plain text password with the stored hash
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    await sendTokenResponse(user, 200, res);

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const logoutUser = async (req, res) => {
  // overwrites the current token cookie with a dummy value that expires instantly
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    sameSite:"none",
  });
  res.status(200).json({ success: true, message: "Logged out" });
};


const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "There is no user with that email" 
      });
    }

    // generates a random string to send to the user's email
    const resetToken = crypto.randomBytes(20).toString("hex");

    // security: hashes the token before storing it in the db. 
    // if the db is leaked, the attacker still doesn't have the actual reset string.
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // sets a short window for the token to be valid (10 minutes)
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // inline html for a professional, branded email experience
    const message = `
    <div style="background-color: #050505; color: #ffffff; padding: 40px; font-family: sans-serif; border-radius: 20px; max-width: 600px; margin: auto; border: 1px solid #1a1a1a;">
        <h1 style="color: #FFF; font-size: 28px; letter-spacing: -1px;">🎬<span style="color:#FFC509">Cine</span>Mood</h1>
        <h2 style="font-size: 20px; margin-top: 20px;">Password Reset Request</h2>
        <p style="color: #a0a0a0; line-height: 1.6;">You told us you forgot your password. No worries! Click the golden button below to set a new one. This link expires in 10 minutes.</p>
        
        <div style="margin: 40px 0;">
        <a href="${resetUrl}" style="background-color: #FFC509; color: #000000; padding: 15px 30px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 14px; display: inline-block;">RESET MY PASSWORD</a>
        </div>
        
        <p style="color: #505050; font-size: 12px;">If you didn't request this, you can safely ignore this email. Your password will stay the same.</p>
        <hr style="border: 0; border-top: 1px solid #1a1a1a; margin-top: 40px;">
        <p style="color: #303030; font-size: 10px; text-align: center;">&copy; 2026 CineMood Engine. All rights reserved.</p>
    </div>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: "Password Reset Request - CineMood",
        message,
      });

      res.status(200).json({ 
        success: true, 
        message: "Email sent successfully" 
      });

    } catch (err) {
      console.error("Email Error:", err);
      // cleanup: if the email fails, we don't want a "ghost" reset token sitting in the db
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({ 
        success: false, 
        message: "Email could not be sent. Please try again later." 
      });
    }

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    // hashes the token provided in the url to see if it matches our stored hashed version
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.resettoken)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }, // ensures the token hasn't timed out
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired token" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);
    
    // clears the reset fields so the same link can't be used twice
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    // logs them in immediately after reset for a smoother user experience
   await sendTokenResponse(user, 200, res);
   
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = { registerUser, loginUser, logoutUser, forgotPassword, resetPassword };