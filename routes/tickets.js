const router = require("express").Router();
const Ticket = require("../Models/Ticket");
const tickets = require("../files/tiket.json");

router.get("/tiket", async (req, res) => {
    try {
        const page = parseInt(req.query.page) - 1 || 0;
        const limit = parseInt(req.query.limit) || 5;
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
            .sort(sortBy)
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
            genres: genreOptions,
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
        // Ambil semua kode tiket yang sudah ada di database
        const existingTicketCodes = (await Ticket.find({}, { _id: 0, code: 1 })).map(ticket => ticket.code);
        
        // Filter data tiket yang belum ada di database
        const newTickets = tickets.filter(ticket => !existingTicketCodes.includes(ticket.code));

        // Jika ada tiket baru, masukkan ke database
        if (newTickets.length > 0) {
            const docs = await Ticket.insertMany(newTickets);
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