const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");
const PedidoController = require("../controllers/PedidoController");

router.get("/disponiveis", authMiddleware, PedidoController.listarDisponiveis);
router.patch("/:id/aceitar", authMiddleware, PedidoController.aceitar);
router.patch("/:id/status", authMiddleware, PedidoController.atualizarStatus);

module.exports = router;
