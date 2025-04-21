const express = require('express')
const app = express();
const multer = require('multer');
const nodemailer = require('nodemailer');
const path = require('path');
const cors = require('cors');
app.use(cors());
// Multer memory storage for file upload (Vercel doesn't support file system writes)
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname) !== '.pdf') {
      return cb(new Error('Only PDF files are allowed'));
    }
    cb(null, true);
  }
}).single('resume'); // 'resume' is the form field name for file upload

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_APP_USER, // Gmail user
    pass: process.env.GMAIL_APP_PASSWORD // Gmail app password
  }
});

module.exports = (req, res) => {
  if (req.method === 'GET') return res.status(200).send("API Working...");

  upload(req, res, function (err) {
    if (err) return res.status(400).json({ message: err.message });

    const { name, email, position } = req.body;
    const resume = req.file;

    // Basic validation
    if (!name || !email || !position || !resume) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const mailOptions = {
      from: process.env.GMAIL_APP_USER, // Sender address
      to: process.env.GMAIL_APP_USER, // Receiver address (same as sender for demo purposes)
      subject: `New Job Application - ${position}`,
      text: `New application received:\n\nName: ${name}\nEmail: ${email}\nPosition: ${position}`,
      attachments: [
        {
          filename: resume.originalname,
          content: resume.buffer
        }
      ]
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.error('Email error:', error);
        return res.status(500).json({ message: 'Failed to send email.' });
      }
      res.status(200).json({ message: 'Application submitted successfully.' });
    });
  });
};