const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

let profil = null;

app.get("/api/profil", (req, res) => {
    res.json(profil);
});

app.post("/api/profil", (req, res) => {
    profil = req.body;
    res.json({ message: "Profil gespeichert", profil });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});
app.get("/api/personen", (req, res) => {
    res.json([]);
});

app.post("/api/likes", (req, res) => {
    console.log("Like bekommen:", req.body);
    res.json({ message: "Like gespeichert" });
});