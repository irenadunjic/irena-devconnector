// Dependencies
const express = require("express");
const connectDB = require("./config/db");
// Constants
const PORT = process.env.PORT || 5000;

// Initializing server and database
const app = express();
connectDB();

// Init Middleware
app.use(express.json({ extended: false }));

// App startup
app.get("/", (req, res) => res.send("API Running"));
app.use("/api/auth", require("./routes/api/auth"));
app.use("/api/posts", require("./routes/api/posts"));
app.use("/api/profile", require("./routes/api/profile"));
app.use("/api/users", require("./routes/api/users"));

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
