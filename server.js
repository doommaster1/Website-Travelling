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

// Setup session middleware
app.use(session({
    secret: 'your-secret-key',
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
            const check = await collection.findOne({name: req.body.userlogin})
            if (!check) {
                res.send('user tidak ditemukan')
            }

            const cekpassword = await bcrypt.compare(
                req.body.passwordlogin,
                check.password
            )
            if (cekpassword) {
                
                req.session.user = check;
                res.render('index');
            } else {
                res.send('Password Salah!')
            }
        } catch (error) {
            res.send('Username/Password salah')
        }
    } else {
        const data = {
            name: req.body.userregis,
            email: req.body.emailregis,
            password: req.body.passwordregis
        }

        const existuser = await collection.findOne({name: data.name})
        if (existuser) {
            res.send("username sudah digunakan, tolong ganti username yang lain")
        } else {
            const saltround = 10
            // const hashemail = await bcrypt.hash(data.email, saltround)
            const hashpassword = await bcrypt.hash(data.password, saltround)

            //mengubah data password menjadi enkripsi
            // data.email = hashemail
            data.password = hashpassword

            const userdata = await collection.insertMany(data);
            if (userdata) {
                res.render('login')
            }
            console.log(userdata);
        }
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
app.get('/setting', (req, res) => {
    res.render('setting');
})

//static
app.use(express.static('Web'))

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
