const express = require("express");

const app = express();
const PORT = 3000;

// Middleware (falls du später JSON senden willst)
app.use(express.json());

// Test-Route
app.get("/", (req, res) => {
    res.send("Server läuft 🚀");
});

// Beispiel API
app.get("/api/test", (req, res) => {
    res.json({ message: "API funktioniert" });
});

// Server starten
app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});