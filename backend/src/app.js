const express = require("express");
const cors = require("cors");
const path = require("path");
const config = require("./config");

const authRoutes = require("./routes/auth");
const pedidosRoutes = require("./routes/pedidos");
const ganhosRoutes = require("./routes/ganhos");
const saquesRoutes = require("./routes/saques");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/pedidos", pedidosRoutes);
app.use("/api/ganhos", ganhosRoutes);
app.use("/api/saques", saquesRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    status: "online",
    service: "NG Motorista API",
    timestamp: new Date().toISOString(),
  });
});

app.use((err, req, res, next) => {
  console.error("Erro:", err);
  res.status(500).json({ ok: false, msg: "Erro interno" });
});

app.listen(config.port, () => {
  console.log(`🚀 Backend Motorista rodando na porta ${config.port}`);
});
