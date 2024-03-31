const express = require('express')
const app = express()
const port = 3000
const ejs = require('ejs')
const expresslayout = require('express-ejs-layouts')
const favicon = require('serve-favicon')
const path = require('path')
const bcrypt = require('bcrypt')
const collection = require('./config')

//convert to json
app.use(express.json());
app.use(express.urlencoded({extended: false}))

app.set("view engine", "ejs")

app.use(favicon(path.join(__dirname, 'web/img', 'logonbg.png')))

//login
app.get('/', (req, res) => {
    res.render('login');
})

//signup dan signin user
app.post('/', async (req, res) => {
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
                res.render('index')
            } else {
                res.send('Password Salah!')
            }
        } catch  {
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
            const hashemail = await bcrypt.hash(data.email, saltround)
            const hashpassword = await bcrypt.hash(data.password, saltround)

            //mengubah data password menjadi enkripsi
            data.email = hashemail
            data.password = hashpassword

            const userdata = await collection.insertMany(data);
            if (userdata) {
                res.render('login')
            }
            console.log(userdata);

        }
    }
})

//tiket
app.get('/tiket', (req, res) => {
    res.render('tiket');
})

//index
app.get('/index', (req, res) => {
    res.render('index');
})

// payment
app.get('/payment', (req, res) => {
    res.render('payment');
})

//static
app.use(express.static('Web'))

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`)
})
