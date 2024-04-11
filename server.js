const express = require('express');
const session = require('express-session');
const app = express();
const port = 3000;
const ejs = require('ejs');
const expresslayout = require('express-ejs-layouts');
const favicon = require('serve-favicon');
const path = require('path');
const bcrypt = require('bcrypt');
const collection = require('./config');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');

// Setup session middleware
app.use(session({
    secret: 'SESSION_SECRET',
    resave: false,
    saveUninitialized: true
}));

// convert to json
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.set("view engine", "ejs");

app.use(favicon(path.join(__dirname, 'web/img', 'logonbg.png')));

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }
    res.redirect('/login');
};

// Index route
app.get('/', isAuthenticated, (req, res) => {
    res.render('index');
});

// Login route
app.post('/login', async (req, res) => {
    if (req.body.userlogin && req.body.passwordlogin) {
        try {
            const check = await collection.findOne({username: req.body.userlogin})
            if (!check) {
                res.send('user tidak ditemukan')
            }

            const cekpassword = await bcrypt.compare(
                req.body.passwordlogin,
                check.password
            )
            if (cekpassword) {
                // Kirim email saat pengguna berhasil login
                sendEmail(check.email)
                    .then(() => {
                        // Set session user
                        req.session.user = check;
                        res.render('index');
                    })
                    .catch((error) => {
                        console.error('Gagal mengirim email: ' + error);
                        res.render('index'); // Render halaman index meskipun gagal mengirim email
                    });
            } else {
                res.send('Password Salah!')
            }
        } catch (error) {
            res.send('Username/Password salah')
        }
    } else {
        // Code untuk proses registrasi
    }
});

// Logout route
app.get('/logout', (req, res) => {
    // Clear session
    req.session.destroy(err => {
        if (err) {
            console.log(err);
        } else {
            res.redirect('/login');
        }
    });
});

// Login middleware to check if user is already authenticated
const loginRedirect = (req, res, next) => {
    if (req.session && req.session.user) {
        res.redirect('/');
    } else {
        next();
    }
};

// Login route - Redirect to index if already logged in
app.get('/login', loginRedirect, (req, res) => {
    res.render('login');
});

// Tiket route
app.get('/tiket', isAuthenticated, (req, res) => {
    res.render('tiket');
});

// Payment route
app.get('/payment', isAuthenticated, (req, res) => {
    res.render('payment');
});

// setting
app.get('/setting', isAuthenticated, (req, res) => {
    const user = req.session.user;
    res.render('setting', { user: user, message: null });
});

// Handle form submission for updating user information
app.post('/update', isAuthenticated, async (req, res) => {
    try {
        const user = req.session.user;
        const updatedUsername = req.body.username;
        const updatedName = req.body.name;
        const updatedEmail = req.body.email;

        await collection.updateOne({ _id: user._id }, {
            $set: {
                username: updatedUsername,
                name: updatedName,
                email: updatedEmail
            }
        });

        req.session.user.username = updatedUsername;
        req.session.user.name = updatedName;
        req.session.user.email = updatedEmail;

        res.json({ message: 'User information updated successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update user information. Please try again.' });
    }
});

// Handle form submission for changing password
app.post('/changepass', isAuthenticated, async (req, res) => {
    try {
        const currentUser = req.session.user;
        const currentPassword = req.body.currentPassword;
        const newPassword = req.body.newPassword;
        const repeatNewPassword = req.body.repeatNewPassword;

        if (newPassword !== repeatNewPassword) {
            return res.status(400).send('New password and repeat new password do not match');
        }

        const user = await collection.findOne({ _id: currentUser._id });
        const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).send('Current password is incorrect');
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        await collection.updateOne({ _id: currentUser._id }, { $set: { password: hashedNewPassword } });

        res.status(200).send('<script>alert("Password updated successfully"); window.location="/setting";</script>');
    } catch (error) {
        console.error(error);
        res.status(500).send('<script>alert("Internal server error"); window.location="/setting";</script>');
    }
});

// Handle form submission for deleting account
app.post('/delete', isAuthenticated, async (req, res) => {
    try {
        const currentUser = req.session.user;
        const confirmPassword = req.body.confirmpassword;

        const user = await collection.findOne({ _id: currentUser._id });
        const isPasswordCorrect = await bcrypt.compare(confirmPassword, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).send('Password is incorrect. Account deletion failed.');
        }

        await collection.deleteOne({ _id: currentUser._id });

        req.session.destroy(err => {
            if (err) {
                console.log(err);
            } else {
                res.redirect('/login');
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
});

// Middleware untuk meng-handle body dari request
app.use(bodyParser.urlencoded({ extended: true }));

// Fungsi untuk mengirim email
async function sendEmail(toEmail) {
    let transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'hansnathanael2004@gmail.com',
            pass: 'xkte kpnw wtym ccnf'
        }
    });

    let info = await transporter.sendMail({
        from: '"Website Travel" <hansnathanael2004@gmail.com>',
        to: toEmail,
        subject: 'Website Travel',
        text: 'Thank You For Trusting Us !!!'
    });

    console.log('Email berhasil dikirim: ', info.messageId);
};

//static
app.use(express.static('Web'))

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
