const mongoose = require("mongoose");

const checkoutSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    id: {
        type: Number,
        required: true
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

module.exports = mongoose.model("checkout", checkoutSchema);