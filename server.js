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
const cors = require("cors");
const tiketRoutes = require("./Routes/tickets");

app.use(cors());

app.use("/api", tiketRoutes)

// Setup session middleware
app.use(
    session({secret: 'SESSION_SECRET', resave: false, saveUninitialized: true})
);

// convert to json
app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.set("view engine", "ejs");

app.use(favicon(path.join(__dirname, 'files/img', 'logonbg.png')));

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }
    res.redirect('/login');
};

// Index route
app.get('/', isAuthenticated, (req, res) => {
    const user = req.session.user;
    res.render('index', {user: user});
});
// Login route
app.post('/login', async (req, res) => {
    const user = req.session.user;
    //untuk login
    if (req.body.userlogin && req.body.passwordlogin) {
        try {
            const check = await collection.findOne({username: req.body.userlogin})
            if (!check) {
                res.send(`<script>alert('User tidak ditemukan'); window.location="/setting";</s' +
                'cript>`)
            }
            const cekpassword = await bcrypt.compare(
                req.body.passwordlogin,
                check.password
            )
            if (cekpassword) {
                sendEmail(check.email)
                    .then(() => {
                        req.session.user = check;
                        res.render('index', {user: check});
                    })
                    .catch((error) => {
                        console.error('Gagal mengirim email: ' + error);
                        res.render('index', {user: user});
                    });
            } else {
                res.send(`<script>alert('Password salah!'); window.location="/setting";</s' +
                'cript>`)
            }
        } catch (error) {
            res.send(`<script>alert('Username/Password salah'); window.location="/setting";</s' +
            'cript>`)
        }
    } else {
        //untuk registrasi
        const data = {
            username: req.body.userregis,
            email: req.body.emailregis,
            password: req.body.passwordregis,
            name: req.body.name
        }
        req.session.userregis = {
            username: data.username,
            email: data.email,
            password: data.password,
            name: data.name
        }
        console.log(data);
        const existuser = await collection.findOne({username: data.username})
        if (existuser) {
            res.send(`<script>alert("Username sudah digunakan, tolong ganti username yang lain"); window.location="/setting";</s' +
            'cript>`)
        }
        // Generate verification code
        const verificationCode = generateVerificationCode();
        // Save verification code and user email to session
        req.session.verification = {
            email: data.email,
            code: verificationCode
        };
        console.log(verificationCode);
        try {
            // Send verification email
            await sendVerificationEmail(data.email, verificationCode);
            res.render('verification', {user: null}); // Render verification page
        } catch (error) {
            console.error('Failed to send verification email:', error);
            res.send(`<script>alert("Failed to send verification email. Please try again later."); window.location="/setting";</s' +
            'cript>`);
        }
    }
});

// Nodemailer configuration
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'hansnathanael2004@gmail.com',
        pass: 'xkte kpnw wtym ccnf'
    }
});

// Generate random verification code
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000);
}

// Send verification email function
async function sendVerificationEmail(email, verificationCode) {
    try {
        await transporter.sendMail({
            from: '"Website Travel" <hansnathanael2004@gmail.com>', // Ganti dengan nama pengirim yang Anda inginkan
            to: email, // Menggunakan parameter email
            subject: 'Verification Code',
            text: `Your verification code is: ${verificationCode}`
        });
        console.log('Verification email sent successfully');
    } catch (error) {
        console.error('Failed to send verification email:', error);
        throw error;
    }
    console.log('Berhasil');
}

// Render verification page
app.get('/verification', (req, res) => {
    console.log('Session verification data:', req.session.verification); // Log session data
    res.render('verification', {user: null});
});

// Handle verification form submission
app.post('/verification', async (req, res) => {
    const {email, code} = req.session.verification;
    let {verificationCode} = req.body;

    // Trim whitespace from verificationCode
    verificationCode = verificationCode.trim();

    console.log('Session verification data:', req.session.verification); // Log session data
    console.log('Form submission data:', req.body); // Log form submission data

    console.log('Kode yang dimasukkan:', verificationCode);
    console.log('Kode yang disimpan:', code);

    // Ensure both codes are of the same data type
    if (verificationCode.toString() !== code.toString()) {
        console.log('Kode verifikasi tidak cocok');
        return res.render('verification', {
            user: null,
            error: 'Incorrect verification code. Please try again.'
        });
    }

    try {
        console.log('Verifikasi berhasil');

        // Periksa apakah req.session.user terdefinisi dan ada
        if (req.session && req.session.userregis) {
            // Lakukan operasi verifikasi di sini
            const data = {
                username: req.session.userregis.username,
                email: email,
                password: req.session.userregis.password,
                name: req.session.userregis.name
            }

            const existuser = await collection.findOne({username: data.username})
            if (existuser) {
                res.send(`<script>alert("Username sudah digunakan, tolong ganti username yang lain"); window.location="/setting";</s' +
                'cript>`)
            } else {
                const saltround = 10;
                const hashpassword = await bcrypt.hash(data.password, saltround);
                data.password = hashpassword;
                try {
                    const userdata = await collection.insertMany(data);
                    console.log(userdata);
                    if (userdata) {
                        return res.redirect('/login');
                    }

                } catch (error) {
                    console.error('Gagal menyimpan data pengguna:', error);
                    return res
                        .status(500)
                        .send(`<script>alert("Gagal menyimpan data pengguna"); window.location="/setting";</s' +
                        'cript>`);
                }
            }

        } else {
            // Jika req.session.user tidak terdefinisi atau tidak ada
            console.error(
                'Failed to update verification status: req.session.user is not defined'
            );
            return res.render('verification', {
                user: null,
                error: 'Failed to verify. Please try again later.'
            });
        }

    } catch (error) {
        console.error('Failed to update verification status:', error);
        return res.render('verification', {
            user: null,
            error: 'Failed to verify. Please try again later.'
        });
    }
});

// Logout route
app.get('/logout', (req, res) => {
    // Clear session
    req
        .session
        .destroy(err => {
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

// Middleware untuk cek admin
function isAdmin(req, res, next) {
    const user = req.session.user;
    if (user.name === 'admin') {
        next();
    } else {
        res
            .status(403)
            .send(`<script>alert("Forbidden"); window.location="/setting";</s' +
            'cript>`);
    }
}

//Tiket route
app.get('/tiket', isAuthenticated, (req, res) => {
    const user = req.session.user;
    // Jika pengguna adalah admin, render 'admintiket'
    if (user.username === 'admin') {
        res.render('admintiket', {user: user});
    } else {
        res.render('tiket', {user: user});
    }
});

// Checkout route
app.post('/checkout', isAuthenticated, async (req, res) => {
    const userEmail = req.body.email;
    const purchasedTickets = req.body.tickets;

    // Process checkout, save order to database, etc. Here you can call the function
    // to send confirmation email
    sendCheckoutConfirmation(userEmail, purchasedTickets)
        .then(() => {
            res.send(`<script>alert('Checkout berhasil! Email konfirmasi telah dikirim.'); window.location="/setting";</s' +
            'cript>`);
        })
        .catch((error) => {
            res
                .status(500)
                .send(`<script>alert("Gagal melakukan checkout:"+ ${error}); window.location="/setting";</s' +
                'cript>`);
        });
});

// Function to send checkout confirmation email
async function sendCheckoutConfirmation(toEmail, purchasedTickets) {
    let message = 'Terima kasih telah melakukan pembelian tiket. Berikut adalah daftar tiket yang' +
            ' Anda beli:\n';
    purchasedTickets.forEach(ticket => {
        message += `- ${ticket.name}: ${ticket.quantity} tiket\n`;
    });

    let transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'hansnathanael2004@gmail.com', // Change this to your email address
            pass: 'xkte kpnw wtym ccnf' // Change this to your email password
        }
    });

    let info = await transporter.sendMail({
        from: '"Website Travel" <hansnathanael2004@gmail.com>', // Change this to your email address
        to: toEmail,
        subject: 'Konfirmasi Pembelian Tiket',
        text: message
    });

    console.log('Email konfirmasi checkout berhasil dikirim: ', info.messageId);
}

// Payment route
app.get('/payment', isAuthenticated, (req, res) => {
    const user = req.session.user;
    res.render('payment', {user: user});
});

// setting route
app.get('/setting', isAuthenticated, (req, res) => {
    const user = req.session.user;
    res.render('setting', {
        user: user,
        message: null
    });
});

// Handle form submission for updating user information
app.post('/update', isAuthenticated, async (req, res) => {
    try {
        const user = req.session.user;
        const updatedUsername = req.body.username;
        const updatedName = req.body.name;
        const updatedEmail = req.body.email;

        await collection.updateOne({
            _id: user._id
        }, {
            $set: {
                username: updatedUsername,
                name: updatedName,
                email: updatedEmail
            }
        });

        req.session.user.username = updatedUsername;
        req.session.user.name = updatedName;
        req.session.user.email = updatedEmail;

        res.json({message: 'User information updated successfully.'});
    } catch (error) {
        console.error(error);
        res
            .status(500)
            .json({error: 'Failed to update user information. Please try again.'});
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
            return res
                .status(400)
                .send('<script>alert("New password and repeat new password do not match"); window.location="/setting";</s' +
                'cript>');
        }

        const user = await collection.findOne({_id: currentUser._id});
        const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordCorrect) {
            return res
                .status(400)
                .send(`<script>alert('Current password is incorrect'); window.location="/setting";</s' +
                'cript>`);
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        await collection.updateOne({
            _id: currentUser._id
        }, {
            $set: {
                password: hashedNewPassword
            }
        });

        res
            .status(200)
            .send(
                '<script>alert("Password updated successfully"); window.location="/setting";</s' +
                'cript>'
            );
    } catch (error) {
        console.error(error);
        res
            .status(500)
            .send(
                '<script>alert("Internal server error"); window.location="/setting";</script>'
            );
    }
});

// Handle form submission for deleting account
app.post('/delete', isAuthenticated, async (req, res) => {
    try {
        const currentUser = req.session.user;
        const confirmPassword = req.body.confirmpassword;

        const user = await collection.findOne({_id: currentUser._id});
        const isPasswordCorrect = await bcrypt.compare(confirmPassword, user.password);
        if (!isPasswordCorrect) {
            return res
                .status(400)
                .send(`<script>alert('Password is incorrect. Account deletion failed.'); window.location="/setting";</s' +
                'cript>`);
        }

        await collection.deleteOne({_id: currentUser._id});

        req
            .session
            .destroy(err => {
                if (err) {
                    console.log(err);
                } else {
                    res.redirect('/login');
                }
            });
    } catch (error) {
        console.error(error);
        res
            .status(500)
            .send(`<script>alert('Internal server error'); window.location="/setting";</s' +
            'cript>`);
    }
});

// Middleware untuk meng-handle body dari request
app.use(bodyParser.urlencoded({extended: true}));

// Fungsi untuk mengirim email
async function sendEmail(toEmail) {
    let transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'hansnathanael2004@gmail.com',
            pass: 'xkte kpnw wtym ccnf'
        }
    });

    let info = await transporter.sendMail(
        {from: '"Website Travel" <hansnathanael2004@gmail.com>', to: toEmail, subject: 'Website Travel', text: 'Thank You For Trusting Us !!!'}
    );

    console.log('Email berhasil dikirim: ', info.messageId);
};

//static
app.use(express.static('files'))

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});