const mongoose = require('mongoose')
const connect = mongoose.connect('mongodb://localhost:27017/User')

//cek koneksi ke mongodb
connect
    .then(() => {
        console.log('Koneksi ke database berhasil');
    })
    .catch(() => {
        console.log('koneksi ke database gagal');
    })

    //membuat skema
    const loginschema = new mongoose.Schema({
    name: {
        type: String,
        require: true
    },
    username: {
        type: String,
        require: true
    },
    email: {
        type: String,
        require: true
    },
    password: {
        type: String,
        require: true
    },
    rememberMeToken:{
        type: String,
        require: true
    }
})

//mengambil data  (custom modul)
const users = new mongoose.model('users', loginschema)

module.exports = users;