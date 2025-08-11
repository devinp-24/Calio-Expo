require("dotenv").config();
console.log("🔑 GOOGLE_PLACES_API_KEY =", process.env.GOOGLE_PLACES_API_KEY);
console.log("🔑 OPENAI_API_KEY =", Boolean(process.env.OPENAI_API_KEY));

process.on("uncaughtException", (err) =>
  console.error("💥 Uncaught Exception:", err)
);
process.on("unhandledRejection", (reason) =>
  console.error("💥 Unhandled Rejection:", reason)
);

const express = require("express");
const cors = require("cors");
const authRouter = require("./routes/auth");

const { healthRouter } = require("./routes/health");
const { userRouter } = require("./routes/user");
const { restaurantsRouter } = require("./routes/restaurants");
const chatRouter = require("./routes/chat");

const app = express();
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ← ${req.method} ${req.url}`);
  next();
});

// Mount routers
app.use("/api/health", healthRouter);
app.use("/api/user", userRouter);
app.use("/api", restaurantsRouter);
app.use("/api", restaurantsRouter);

app.use("/api", chatRouter);
app.use("/api/auth", authRouter);

// 404 handler
app.use((req, res) => res.status(404).json({ error: "Not Found" }));

// Global error handler
app.use((err, req, res, next) => {
  console.error("💥 Server Error:", err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend listening on 0.0.0.0:${PORT}`);
});

// Keep Node alive
process.stdin.resume();
