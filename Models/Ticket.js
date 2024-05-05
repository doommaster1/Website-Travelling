const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
    kota: {
        type: String,
        required: true
    },
    negara:{
        type: String,
        required:true
    },
    harga: {
        type: String,
        required: true
    },
    created:{
        type: Date,
        required: true,
        default: Date.now,
    },
    benua: {
        type: String,
        required: true
    },
    fasilitas: {
        type: [String],
        required: true
    },
    image: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model("ticket", ticketSchema);