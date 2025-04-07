// emailService.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail", // Change to your email service provider (e.g., Gmail, SES, SendGrid)
  auth: {
    user: process.env.EMAIL_USER, // Your email address
    pass: process.env.EMAIL_PASSWORD, // Your email password or app-specific password
  },
});

const sendEmail = async (to, subject, text, htmlContent = '') => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text, // Plain text version of the message
    html: htmlContent, // HTML version of the message
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

module.exports = { sendEmail };
