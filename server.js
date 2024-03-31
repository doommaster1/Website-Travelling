const express = require('express')
const app = express()
const port = 3000
const ejs = require('ejs')
const expresslayout = require('express-ejs-layouts')
const favicon = require('serve-favicon')
const path = require('path')

app.set("view engine", "ejs")

app.use(favicon(path.join(__dirname, 'web/img', 'logonbg.png')))

//index
app.get('/', (req, res) => {
    res.render('index');
})

//tiket
app.get('/tiket', (req, res) => {
    res.render('tiket');
})

//login
app.get('/login', (req, res) => {
    res.render('login');
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
