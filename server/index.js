require("dotenv").config();
const express = require("express");
const cors = require("cors");
const logosRouter = require("./routes/logos");
const exportRouter = require("./routes/export");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use("/api/logos", logosRouter);
app.use("/api/export", exportRouter);

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
