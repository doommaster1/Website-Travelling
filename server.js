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
    // const User = req.session.user;
    // res.render('index', { user: User, message: null });
    res.render('index');
});

// Login route
app.post('/login', async (req, res) => {
    if (req.body.userlogin && req.body.passwordlogin) {
        try {
            const check = await collection.findOne({username: req.body.userlogin})
            if (!check) {
                res.send('user tidak ditemukann')
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
            username: req.body.userregis,
            email: req.body.emailregis,
            password: req.body.passwordregis,
            name: ""
        }   

        const existuser = await collection.findOne({username: data.username})
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
    res.render('login');;
});

// Tiket route
app.get('/tiket', isAuthenticated, (req, res) => {
    // const user = req.session.user;
    // res.render('tiket', { user: user, message: null });
    res.render('tiket');
});

// Payment route
app.get('/payment', isAuthenticated, (req, res) => {
    // const user = req.session.user;
    // res.render('payment', { user: user, message: null });
    res.render('payment');
});


// setting
app.get('/setting', isAuthenticated, (req, res) => {
    // Retrieve user data from session
    const user = req.session.user;
    res.render('setting', { user: user, message: null });
});

// Handle form submission for updating user information
app.post('/update', isAuthenticated, async (req, res) => {
    try {
        // Retrieve user data from session
        const user = req.session.user;

        // Update user information with form data
        const updatedUsername = req.body.username;
        const updatedName = req.body.name;
        const updatedEmail = req.body.email;

        // Update user information in the database
        await collection.updateOne({ _id: user._id }, {
            $set: {
                username: updatedUsername,
                name: updatedName,
                email: updatedEmail
            }
        });

        // Update user data in session
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

        // Check if new password and repeat new password match
        if (newPassword !== repeatNewPassword) {
            return res.status(400).send('New password and repeat new password do not match');
        }

        // Check if current password is correct
        const user = await collection.findOne({ _id: currentUser._id });
        const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).send('Current password is incorrect');
        }

        // Hash the new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Update password in the database
        await collection.updateOne({ _id: currentUser._id }, { $set: { password: hashedNewPassword } });

        // Send success alert to client
        res.status(200).send('<script>alert("Password updated successfully"); window.location="/setting";</script>');
    } catch (error) {
        console.error(error);
        // Send error alert to client
        res.status(500).send('<script>alert("Internal server error"); window.location="/setting";</script>');
    }
});

// Handle form submission for deleting account
app.post('/delete', isAuthenticated, async (req, res) => {
    try {
        const currentUser = req.session.user;
        const confirmPassword = req.body.confirmpassword;

        // Check if current password is correct
        const user = await collection.findOne({ _id: currentUser._id });
        const isPasswordCorrect = await bcrypt.compare(confirmPassword, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).send('Password is incorrect. Account deletion failed.');
        }

        // Delete the user account from the database
        await collection.deleteOne({ _id: currentUser._id });

        // Clear session
        req.session.destroy(err => {
            if (err) {
                console.log(err);
            } else {
                res.redirect('/login'); // Redirect to login page after successful deletion
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
});


//static
app.use(express.static('Web'))

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
