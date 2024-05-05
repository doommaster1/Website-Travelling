const tickets = require("../files/tiket.json");
const multer = require('multer')
const fs = require('fs');
const {type} = require('os');
const express = require('express');
const router = express.Router();
const Ticket = require("../Models/Ticket");
const session = require('express-session');

// Middleare to check session
router.use(session({
    secret: 'your_secret_key', // ganti dengan kunci rahasia sesi Anda
    resave: false,
    saveUninitialized: true
}));

router.get('/add', (req, res) => {
    res.render('add_tickets', {title: "Add Tickets"});
});

// upload gambar
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads');
    },
    filename: function (req, file, cb) {

        cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    }
});

var upload = multer({storage: storage}).single('image');

//Insert a tiket into database route
router.post('/add', upload, (req, res) => {
    const tiket = new Ticket(
        {kota: req.body.kota, negara: req.body.negara, harga: req.body.harga, benua: req.body.benua, image: req.file.filename}
    );

    tiket
        .save()
        .then(() => {
            req.session.message = {
                type: 'success',
                message: 'Ticket added successfully!'
            };
            res.redirect('/tiket');
        })
        .catch((err) => {
            res.json({message: err.message, type: 'danger'});
        });

});

// get all tickets route
router.get('/tiket', (req, res) => {
    // Memeriksa apakah req.session.user terdefinisi
    if (req.session.user) {
        const username = req.session.user.username;
        // Jika pengguna adalah admin, render 'admintiket'
        if (username === 'admin') {
            Ticket
                .find()
                .exec()
                .then(ticket => {
                    res.render('admintiket', {
                        title: 'Tiket Page',
                        ticket: ticket
                    });
                })
                .catch(err => {
                    res.json({message: err.message});
                });
        } else {
            // Jika pengguna bukan admin, render 'tiket'
            res.render('tiket', {
                user: {
                    username: username
                }
            });
        }
    } else {
        // Handle the case where req.session.user is not defined
        res.redirect('/login'); // Redirect to login page or handle as needed
    }
});

// edit a ticket route
router.get('/edit/:id', (req, res) => {
    let id = req.params.id;
    Ticket
        .findById(id)
        .then(ticket => {
            if (!ticket) { // Mengganti "ticket == ull" dengan "!ticket"
                res.redirect('/tiket');
            } else {
                res.render('edit_tickets', {
                    title: 'Edit Ticket',
                    ticket: ticket
                });
            }
        })
        .catch(err => {
            console.error(err);
            res.redirect('/tiket');
        });
});

router.post('/update/:id', upload, (req, res) => {
    let id = req.params.id;
    let new_image = '';

    if (req.file) {
        new_image = req.file.filename;
        try {
            fs.unlinkSync('./uploads/' + req.body.old_image);
        } catch (err) {
            console.log(err);
        }
    } else {
        new_image = req.body.old_image;
    }

    Ticket
        .findByIdAndUpdate(id, {
            kota: req.body.kota,
            negara: req.body.negara,
            harga: req.body.harga,
            image: new_image
        })
        .then(result => {
            req.session.message = {
                type: 'success',
                message: 'Ticket updated successfully!'
            };
            res.redirect("/");
        })
        .catch(err => {
            res.json({message: err.message, type: 'danger'});
        });
});

// Delete ticket route
router.get('/delete/:id', (req, res) => {
    let id = req.params.id;
    Ticket
        .findByIdAndDelete(id)
        .then(result => {
            if (result.image != '') {
                try {
                    fs.unlinkSync('./uploads/' + result.image);
                } catch (err) {
                    console.log(err);
                }
            }
            req.session.message = {
                type: 'info',
                message: 'Ticket deleted successfully!'
            };
            res.redirect('/');
        })
        .catch(err => {
            res.json({message: err.message});
        });
});

router.get("/tiket", async (req, res) => {
    try {
        const page = parseInt(req.query.page) - 1 || 0;
        const limit = parseInt(req.query.limit) || 100;
        const search = req.query.search || "";
        let sort = req.query.sort || "harga";
        let fasilitas = req.query.fasilitas || "All";

        const fasilitasOptions = ["Pesawat", "Kereta", "Bus", "Kapal"];

        fasilitas === "All"
            ? (fasilitas = [...fasilitasOptions])
            : (fasilitas = req.query.fasilitas.split(","));
        req.query.sort
            ? (sort = req.query.sort.split(","))
            : (sort = [sort]);

        let sortBy = {};
        if (sort[1]) {
            sortBy[sort[0]] = sort[1];
        } else {
            sortBy[sort[0]] = "asc";
        }

        const tickets = await Ticket
            .find({
                name: {
                    $regex: search,
                    $options: "i"
                }
            })
            .where("fasilitas")
            . in ([...fasilitas])
            .sort(sortBy) // Gunakan pengurutan yang ditentukan
            .skip(page * limit)
            .limit(limit);

        const total = await Ticket.countDocuments({
            genre: {
                $in: [...fasilitas]
            },
            name: {
                $regex: search,
                $options: "i"
            }
        });

        const response = {
            eror: false,
            total,
            page: page + 1,
            limit,
            genres: fasilitasOptions,
            tickets
        };

        res
            .status(200)
            .json(response);

    } catch (err) {
        console.log(err);
        res
            .status(500)
            .json({eror: true, message: "Internal Server Eror"});

    }
});

const insertTickets = async () => {
    try {
        // Ambil semua tiket yang sudah ada di database
        const existingTickets = await Ticket.find();

        // Filter data tiket yang belum ada di database
        const newTickets = tickets.filter(newTicket => {
            return !existingTickets.some(existingTicket => {
                // Lakukan pengecekan kesamaan berdasarkan atribut-atribut tiket
                return newTicket.name === existingTicket.name && newTicket.kota === existingTicket.kota && newTicket.negara === existingTicket.negara && newTicket.harga === existingTicket.harga && newTicket.benua === existingTicket.benua;
            });
        });

        // Jika ada tiket baru, masukkan ke database
        if (newTickets.length > 0) {
            const docs = await Ticket.insertMany(newTickets, {ordered: false});
            console.log("Data baru telah ditambahkan ke database.");
            return Promise.resolve(docs);
        } else {
            console.log("Tidak ada data baru untuk dimasukkan.");
            return Promise.resolve();
        }
    } catch (err) {
        return Promise.reject(err);
    }
};

insertTickets()
    .then((docs) => console.log(docs))
    .catch((err) => console.log(err));

module.exports = router;