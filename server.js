const express = require('express')
const app = express()
const port = 3000
const ejs = require('ejs')

app.set("view engine", "ejs")

//index
app.get('/', (req, res) => {
    res.render('index')
})

//tiket
app.get('/tiket',(req, res) => {
    res.render('tiket')
})

//static
app.use(express.static('Web'))

// app.get('/', (req, res) => {
//     res.send('Hello World!')
// })

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`)
})
