const sendEmail = require("../utils/sendEmail");

// Handles user support requests via email
exports.contactSupport = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Basic validation to prevent empty submissions
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    // 1. Alert the Admin (You)
    const adminMailOptions = {
      email: process.env.GMAIL_USER, // Sends to your own inbox
      subject: `🚨 [SUPPORT] Message from ${name}`,
      message: `
        <div style="background-color: #050505; color: #ffffff; padding: 30px; font-family: sans-serif; border: 1px solid #FFC509; border-radius: 15px;">
          <h2 style="color: #FFC509;">New Support Ticket</h2>
          <p><strong>User:</strong> ${name}</p>
          <p><strong>Reply-To:</strong> ${email}</p>
          <div style="background: #111; padding: 15px; border-radius: 8px; margin-top: 10px;">
            ${message}
          </div>
        </div>
      `,
    };

    // 2. Alert the User (Confirmation Receipt)
    const userMailOptions = {
      email: email, // Sends to the user who filled the form
      subject: "We've received your message - CineMood",
      message: `
        <div style="background-color: #050505; color: #ffffff; padding: 30px; font-family: sans-serif; border-radius: 15px;">
          <h1 style="color: #FFC509;">🎬 CineMood</h1>
          <p>Hi ${name},</p>
          <p>Our neural engine has received your transmission. A human team member will review your request and get back to you shortly.</p>
          <p style="color: #555; font-size: 12px;">Your message: "${message}"</p>
          <hr style="border: 0; border-top: 1px solid #1a1a1a; margin: 20px 0;">
          <p style="font-size: 10px; color: #333;">&copy; 2026 CineMood Engine</p>
        </div>
      `,
    };

    /**
     * Promise.all: Triggers both emails simultaneously.
     * This is slightly faster than using 'await' on them separately.
     */
    await Promise.all([
      sendEmail(adminMailOptions),
      sendEmail(userMailOptions)
    ]);

    res.status(200).json({ success: true, message: "Transmission successful" });
  } catch (error) {
    // Hidden logging for debugging, generic message for user security
    console.error("Support Mail Error:", error); 
    res.status(500).json({ success: false, message: "Mail server error" });
  }
};