const multer = require('multer');
const nodemailer = require('nodemailer');
const path = require('path');

// Multer memory storage (Vercel doesn't allow file system write)
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname) !== '.pdf') {
      return cb(new Error('Only PDF files are allowed'));
    }
    cb(null, true);
  }
}).single('resume');

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_APP_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

module.exports = (req, res) => {
  if (req.method === 'GET') return res.status(200).send("API Working...");

  upload(req, res, function (err) {
    if (err) return res.status(400).json({ message: err.message });

    const { name, email, position } = req.body;
    const resume = req.file;

    if (!name || !email || !position || !resume) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const mailOptions = {
      from: process.env.GMAIL_APP_USER,
      to: process.env.GMAIL_APP_USER,
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