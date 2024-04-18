const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'hansnathanael2004@gmail.com',
        pass: 'xkte kpnw wtym ccnf'
    }
});

const mailOptions = {
    from: 'hansnathanael2004@gmail.com',
    to: 'hansnathanael04@gmail.com',
    subject: 'Website Travel',
    text: 'Pengiriman melalui aplikasi nodeJS'
};

transporter.sendMail(mailOptions, function (err, info) {
    if (err) {
        console.log(err);
    } else {
        console.log('Email terkirim!');
        console.log('Info : ', info.response);
    }
});