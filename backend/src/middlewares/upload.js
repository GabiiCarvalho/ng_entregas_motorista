const multer = require("multer");
const path = require("path");
const config = require("../config");

const docStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, config.upload.documentosDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`,
    );
  },
});

const fotoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, config.upload.fotosDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `foto-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Tipo não permitido"), false);
  }
};

const uploadDocumento = multer({
  storage: docStorage,
  limits: { fileSize: config.upload.maxFileSize },
  fileFilter,
});
const uploadFoto = multer({
  storage: fotoStorage,
  limits: { fileSize: config.upload.maxFileSize },
  fileFilter,
});

module.exports = { uploadDocumento, uploadFoto };
