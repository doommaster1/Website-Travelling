const express = require('express')
const app = express()
const port = 3000
const ejs = require('ejs')
const expresslayout = require('express-ejs-layouts')

app.set("view engine", "ejs")

// app.use(expresslayout)

//index
app.get('/', (req, res) => {
    res.render('index'/*, {title : "Travel with Us", layout : "layout/main.ejs"}*/);
})

//tiket
app.get('/tiket',(req, res) => {
    res.render('tiket');
})

//login
app.get('/login',(req, res) => {
    res.render('login');
})

// payment
app.get('/payment',(req, res) => {
    res.render('payment');
})

//static
app.use(express.static('Web'))

// app.get('/', (req, res) => {
//     res.send('Hello World!')
// })

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`)
})
