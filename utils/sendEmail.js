const nodemailer = require("nodemailer");

// Asynchronous function to dispatch emails via Gmail
const sendEmail = async (options) => {
  // Configures the connection to Google's SMTP servers
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER, // Your secure Gmail address
      pass: process.env.GMAIL_APP_PASSWORD, // 16-character App Password (NOT your login password)
    },
  });

  const message = {
    // Sets the "From" name to CineMood Engine for a professional look
    from: `CineMood Engine <${process.env.GMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    // Supports HTML templates for the styled notifications you've built
    html: options.message, 
  };

  // Triggers the actual transmission
  const info = await transporter.sendMail(message);
  
  // Clean logging for the server console
  console.log("Mail delivered to:", options.email);
};

module.exports = sendEmail;