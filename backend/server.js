const express      = require("express");
const cors         = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", require("./routes/auth"));

// Health check
app.get("/api/health", (req, res) => res.json({ ok: true }));

app.listen(process.env.PORT || 5000, () =>
  console.log(`✅  API running on http://40.81.17.129:${process.env.PORT || 5000}`)
);