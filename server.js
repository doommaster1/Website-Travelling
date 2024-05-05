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
const tiketRoutes = require("./routes/tickets");
const checkoutRoutes = require("./routes/checkout");
const fs = require('fs');
const {MongoClient} = require('mongodb');
const cookieParser = require('cookie-parser');

app.use(cors());

app.use("/api", tiketRoutes)

// convert to json
app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.set("view engine", "ejs");

app.use(favicon(path.join(__dirname, 'files/img', 'logonbg.png')));

// Setup session middleware
app.use(
    session({secret: 'SESSION_SECRET', resave: false, saveUninitialized: true})
);

// Use cookie-parser middleware to parse cookies
app.use(cookieParser());

// Use session middleware
app.use(session({
    secret: 'valeroy', // Change this to a secure secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 * 7 } // 1 week expiration
}));

const checkRememberMe = async (req, res, next) => {
    if (req.cookies.rememberMe) {
        const rememberMeToken = req.cookies.rememberMe;
        // Retrieve user from the database based on the token
        try {
            const user = await collection.findOne({ rememberMeToken });
            if (user) {
                req.session.user = user; // Authenticate the user
            }
        } catch (error) {
            console.error('Error retrieving user:', error);
        }
    }
    next();
};


// Helper function to generate a random remember-me token
function generateRememberMeToken() {
    return Math.random().toString(36).slice(2);
}

// Middleware to check if user is authenticated based on session or remember me cookie
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        // User is authenticated via session
        next();
    } else if (req.cookies.rememberMe) {
        // User is authenticated via remember me cookie
        // Redirect to login or handle authentication using the remember me token
        checkRememberMe(req, res, next);
    } else {
        res.render('login');
    }
};

// Index route
app.get('/', isAuthenticated, (req, res) => {
    const user = req.session.user;
    res.render('index', {user: user});
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

// Login route
app.post('/login', async (req, res) => {
    const user = req.session.user;
    const { userlogin, rememberme } = req.body;
    // For remember me functionality, check if rememberme checkbox is checked
    if (rememberme) {
        // Generate remember me token
        const rememberMeToken = generateRememberMeToken();
        // Set remember me cookie with the token
        res.cookie('rememberMe', rememberMeToken, { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true });
        console.log(rememberMeToken);
        // Save rememberMeToken to the user document in the database
        try {
            await collection.updateOne({ username: userlogin }, { $set: { rememberMeToken } });
        } catch (error) {
            console.error('Error updating rememberMeToken:', error);
        }
    }
    //untuk login
    if (req.body.userlogin && req.body.passwordlogin) {
        try {
            const check = await collection.findOne({username: req.body.userlogin})
            if (!check) {
                res.render('login', { error: 'User Tidak Ditemukan' });
                return;
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
                res.render('login', { error: 'Password Salah !' });
                return;
            }
        } catch (error) {
            res.render('login', { error: 'Username/Password Salah !' });
                return;
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
            res.send(
                `<script>alert("Username sudah digunakan, tolong ganti username yang lain"); window.location="/setting";</s' +
            'cript>`
            )
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
            res.send(
                `<script>alert("Failed to send verification email. Please try again later."); window.location="/setting";</s' +
            'cript>`
            );
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
                name: req.session.userregis.name,
                rememberMeToken: ""
            }

            const existuser = await collection.findOne({username: data.username})
            if (existuser) {
                res.send(
                    `<script>alert("Username sudah digunakan, tolong ganti username yang lain"); window.location="/setting";</s' +
                'cript>`
                )
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
                        .send(
                            `<script>alert("Gagal menyimpan data pengguna"); window.location="/setting";</s' +
                        'cript>`
                        );
                }
            }

        } else if (req.session && req.session.forgot) {
            return res.redirect('/reset');
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

//forgot route
app.get('/forgot', (req, res) => {
    res.render('forgot');
});

//forgot route
app.post('/forgot', async (req, res) => {
    const data = {
        username: req.body.username,
        email: req.body.email
    }

    console.log(data);
    const existuser = await collection.findOne({username: data.username})
    if (existuser) {
        req.session.forgot = {
            username: data.username,
            email: data.email,
            password: existuser.password,
            name: existuser.name
        }
        console.log(req.session.forgot);
    } else {
        res.send(
            `<script>alert("Username sudah digunakan, tolong ganti username yang lain"); window.location="/setting";</s' +
        'cript>`
        )
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
        res.send(
            `<script>alert("Failed to send verification email. Please try again later."); window.location="/setting";</s' +
        'cript>`
        );
    }
});

//reset route
app.get('/reset', (req, res) => {
    res.render('reset');
});

//reset Post
app.post('/reset', async (req, res) => {
    try {
        const password = req.body.newpassword;
        const repassword = req.body.repassword;
        if (password !== repassword) {
            return res
                .status(400)
                .send(
                    '<script>alert("New password and repeat new password do not match"); window.loc' +
                    'ation="/setting";</script>'
                );
        }
        const hashedNewPassword = await bcrypt.hash(password, 10);

        await collection.updateOne({
            username: req.session.forgot.username
        }, {
            $set: {
                password: hashedNewPassword
            }
        });
        console.log(req.session.forgot.password);
        res.redirect('/login');
    } catch (error) {
        console.error(error);
        res
            .status(500)
            .send(
                '<script>alert("Internal server error"); window.location="/setting";</script>'
            );
    }
});

// Logout route
app.get('/logout', (req, res) => {
    // Clear session
    res.clearCookie('rememberMe');
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

// // Middleware untuk cek admin
// function isAdmin(req, res, next) {
//     const user = req.session.user;
//     if (user.name === 'admin') {
//         next();
//     } else {
//         res
//             .status(403)
//             .send(
//                 `<script>alert("Forbidden"); window.location="/setting";</s' +
//             'cript>`
//             );
//     }
// }

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

function sendCheckoutConfirmation() {
    // Menggunakan path.join untuk menggabungkan direktori dengan nama file
    const filePath = path.join(__dirname, 'web', 'tiket.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error membaca file tiket.json:', err);
            return;
        }
        console.log('Isi file tiket.json:', data);
    });
}

// Fungsi untuk mengirim email konfirmasi
async function sendCheckoutConfirmation(userEmail, purchasedTickets) {
    try {
        // Koneksi ke MongoDB
        const uri = 'mongodb://localhost:27017'; // Ganti dengan URI MongoDB Anda
        const client = new MongoClient(uri);

        await client.connect();

        const database = client.db('User'); // Ganti dengan nama database Anda
        const tikets = database.collection('tikets'); // Ganti dengan nama koleksi tiket Anda
        const check = await collection.findOne({email: userEmail})
        const username = check.username;
        console.log(username);
        console.log(userEmail);
        // Mengambil data tiket dari MongoDB
        const tiket = await tikets
            .find()
            .toArray();

        // Buat pesan email
        let message = `
        <div style="font-family: Arial, sans-serif; margin: auto; width: 80%;">
            <h2 style="text-align: center;">Surat Invoice Pembelian Tiket</h2>
            <p>Kepada Yth, <strong>${username}</strong></p>
            <p>Terima kasih telah melakukan pembelian tiket. Berikut adalah detail pembayaran Anda:</p>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                    <tr style="background-color: #f2f2f2;">
                        <th style="padding: 8px; border: 1px solid #dddddd; text-align: left;">Destinasi</th>
                        <th style="padding: 8px; border: 1px solid #dddddd; text-align: left;">Jumlah Tiket</th>
                        <th style="padding: 8px; border: 1px solid #dddddd; text-align: left;">Harga Satuan</th>
                        <th style="padding: 8px; border: 1px solid #dddddd; text-align: left;">Total</th>
                    </tr>
                </thead>
                <tbody>`;
        let total = 0;
        purchasedTickets.forEach(pesanan => {
            const tiketDipesan = tiket.find(item => item.id === pesanan.id);
            if (tiketDipesan) {
                const subtotal = parseFloat(pesanan.quantity) * parseFloat(tiketDipesan.price); // Mengonversi string ke tipe data numerik
                total += subtotal;
                message += `
                    <tr>
                        <td style="padding: 8px; border: 1px solid #dddddd;">${tiketDipesan.name}</td>
                        <td style="padding: 8px; border: 1px solid #dddddd;">${pesanan.quantity}</td>
                        <td style="padding: 8px; border: 1px solid #dddddd;">${tiketDipesan.price}</td>
                        <td style="padding: 8px; border: 1px solid #dddddd;">${subtotal}</td>
                    </tr>`;
            }
        });
        message += `
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" style="padding: 8px; border: 1px solid #dddddd; text-align: right;"><strong>Total Pembayaran:</strong></td>
                        <td style="padding: 8px; border: 1px solid #dddddd;"><strong>${total}</strong></td>
                    </tr>
                </tfoot>
            </table>
            <p>Mohon segera melakukan pembayaran. Tiket akan dikirim setelah pembayaran Anda kami terima.</p>
            <p>Terima kasih.</p>
            <p>Hormat kami,</p>
            <p>Website Travel</p>
        </div>`;

        // Konfigurasi transporter email
        let transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: 'hansnathanael2004@gmail.com', // Ganti dengan alamat email Anda
                pass: 'xkte kpnw wtym ccnf' // Ganti dengan password email Anda
            }
        });

        // Kirim email
        let info = await transporter.sendMail({
            from: '"Website Travel" <hansnathanael2004@gmail.com>', // Ganti dengan alamat email Anda
            to: userEmail,
            subject: 'Invoice Pembelian Tiket',
            html: message
        });

        console.log('Email konfirmasi checkout berhasil dikirim: ', info.messageId);

        // Tutup koneksi ke MongoDB
        await client.close();
    } catch (err) {
        throw new Error('Gagal mengirim email konfirmasi checkout: ' + err);
    }
}

// Checkout route
app.post('/checkout', isAuthenticated, async (req, res) => {
    const userEmail = req.body.email;
    const purchasedTickets = req.body.tickets;

    // Process checkout, save order to database, etc. Here you can call the function
    // to send confirmation email
    try {
        await sendCheckoutConfirmation(userEmail, purchasedTickets);
        res.send('Checkout berhasil! Email konfirmasi telah dikirim.');
    } catch (error) {
        res
            .status(500)
            .send('Gagal melakukan checkout: ' + error);
    }
});

// const pesananUser = [     { id: 1, quantity: 2 },  Contoh pesanan user:
// memesan 2 tiket dengan ID 1     { id: 3, quantity: 1 }   Contoh pesanan user:
// memesan 1 tiket dengan ID 3 ]; sendCheckoutConfirmation('contoh@email.com',
// pesananUser)     .then(() => console.log('Email konfirmasi checkout berhasil
// dikirim'))     .catch(err => console.error('Gagal mengirim email konfirmasi
// checkout:', err)); Payment route
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
                .send(
                    '<script>alert("New password and repeat new password do not match"); window.loc' +
                    'ation="/setting";</script>'
                );
        }

        const user = await collection.findOne({_id: currentUser._id});
        const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordCorrect) {
            return res
                .status(400)
                .send(
                    `<script>alert('Current password is incorrect'); window.location="/setting";</s' +
                'cript>`
                );
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
                .send(
                    `<script>alert('Password is incorrect. Account deletion failed.'); window.location="/setting";</s' +
                'cript>`
                );
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
            .send(
                `<script>alert('Internal server error'); window.location="/setting";</s' +
            'cript>`
            );
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