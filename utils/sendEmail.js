const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  // 1. Create the transporter using your Ethereal credentials
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports like 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // 2. Define the email options
  const message = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.message, // This allows the <h1> and <a> tags to work
  };

  // 3. Send the actual email
  const info = await transporter.sendMail(message);

  console.log("Message sent: %s", info.messageId);
  // Preview URL for Ethereal (very helpful for dev)
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
};

module.exports = sendEmail;