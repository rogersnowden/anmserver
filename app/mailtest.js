// nodemailer test
const nodemailer = require('nodemailer');

async function sendTestEmail() {
  // Create a transporter using Gmail SMTP
  
  //const transporter = nodemailer.createTransport({
	//  // Era Deckow
    //service: 'gmail',
    //auth: {
    //  user: 'anmtest7@gmail.com',
    //  pass: 'Yglesia_11'
    //}
  //});

const transporter = nodemailer.createTransport({
    service: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'era79@ethereal.email',
        pass: 't4D95vAnJz5UKjJXXc'
    }
});

  // Set up email data
  const mailOptions = {
    from: 'era79@ethereal.email',   // sender address
    to: 'rsnowden@cox.net', // list of receivers
    subject: 'Test Email', // subject line
    text: 'Hello from nodemailer!'  // plain text body
  };

  // Send the email
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

sendTestEmail();
