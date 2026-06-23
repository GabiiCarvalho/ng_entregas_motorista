const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");
const SaqueController = require("../controllers/SaqueController");

router.get("/", authMiddleware, SaqueController.listar);
router.post("/", authMiddleware, SaqueController.solicitar);

module.exports = router;
