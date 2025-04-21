const express = require('express');
const multer = require('multer');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/",(req,res)=>{
    res.send("Api Working...")
})

// Multer setup for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (path.extname(file.originalname) !== '.pdf') {
      return cb(new Error('Only PDF files are allowed'));
    }
    cb(null, true);
  }
});

// 🔐 Setup your Gmail and App Password
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_APP_USER,         // ⚠️ Replace with your Gmail
    pass: process.env.GMAIL_APP_PASSWORD    // ⚠️ Replace with your Gmail App Password
  }
});


// POST API for form submission
app.post('/apply', upload.single('resume'), (req, res) => {
  const { name, email, position } = req.body;
  const resume = req.file;

  if (!name || !email || !position || !resume) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  const mailOptions = {
    from: process.env.GMAIL_APP_USER,
    to: process.env.GMAIL_APP_USER,    // ⚠️ Can be same or HR email
    subject: `New Job Application - ${position}`,
    text: `New application received:\n\nName: ${name}\nEmail: ${email}\nPosition: ${position}`,
    attachments: [
      {
        filename: resume.originalname,
        path: resume.path
      }
    ]
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.error('Email send error:', error);
      return res.status(500).json({ message: 'Failed to send email.' });
    } else {
      console.log('Email sent: ' + info.response);
      res.status(200).json({ message: 'Application submitted and emailed successfully.' });
    }
  });
});


app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});