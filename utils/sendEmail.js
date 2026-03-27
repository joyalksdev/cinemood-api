const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  // Use Gmail service instead of manual host/port
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER, // Your gmail address
      pass: process.env.GMAIL_APP_PASSWORD, // The 16-character App Password
    },
  });

  const message = {
    from: `CineMood Engine <${process.env.GMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.message, // Your beautiful HTML template from authController
  };

  const info = await transporter.sendMail(message);
  console.log("Mail delivered to:", options.email);
};

module.exports = sendEmail;