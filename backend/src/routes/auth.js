const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/AuthController");
const authMiddleware = require("../middlewares/auth");
const { uploadDocumento, uploadFoto } = require("../middlewares/upload");

router.post("/motorista/cadastro", AuthController.register);
router.post("/motorista/login", AuthController.login);
router.get("/motorista/perfil", authMiddleware, AuthController.perfil);
router.post(
  "/motorista/face",
  authMiddleware,
  uploadFoto.single("face"),
  AuthController.verificarFace,
);
router.post(
  "/motorista/upload-doc",
  authMiddleware,
  uploadDocumento.single("file"),
  AuthController.uploadDocumento,
);
router.post(
  "/motorista/upload-foto",
  authMiddleware,
  uploadFoto.single("foto"),
  AuthController.uploadFoto,
);
router.patch(
  "/motorista/localizacao",
  authMiddleware,
  AuthController.atualizarLocalizacao,
);

module.exports = router;
