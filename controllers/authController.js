const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendTokenResponse = require("../utils/sendTokenResponse");

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

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({ email, password: hashedPassword });

    sendTokenResponse(user, 201, res);
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

    const user = await User.findOne({ email }).select("+password"); 
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Logout function to clear the cookie
const logoutUser = async (req, res) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ success: true, message: "Logged out" });
};

const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // 1. Check if user exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "There is no user with that email" 
      });
    }

    // 2. Generate unhashed reset token
    const resetToken = crypto.randomBytes(20).toString("hex");

    // 3. Hash token and set to resetPasswordToken field in DB
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // 4. Set token expiry (10 minutes from now)
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    // Save user with new fields (bypass password validation if you have any)
    await user.save({ validateBeforeSave: false });

    // 5. Create the reset URL for your React Frontend
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // 6. Define the email content
    const message = `
    <div style="background-color: #050505; color: #ffffff; padding: 40px; font-family: sans-serif; border-radius: 20px; max-width: 600px; margin: auto; border: 1px solid #1a1a1a;">
        <h1 style="color: #FFC509; font-size: 28px; letter-spacing: -1px;">🎬CineMood</h1>
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
      // 7. Attempt to send the email
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
      // 8. If email fails, clear the token fields in DB and throw error
      console.error("Email Error:", err);
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
    // 1. Hash the token from the URL to compare with DB
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.resettoken)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }, // Must be in the future
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired token" });
    }

    // 2. Set new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);
    
    // 3. Clear reset fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    // 4. Log user in immediately
    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Add these to your module.exports
module.exports = { registerUser, loginUser, logoutUser, forgotPassword, resetPassword };
