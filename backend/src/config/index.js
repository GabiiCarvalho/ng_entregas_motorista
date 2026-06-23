require("dotenv").config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  database: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306"),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "ng_motorista",
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
  },
  jwt: {
    secret: process.env.JWT_SECRET || "ng_motorista_secret_key_2024",
    expiresIn: "7d",
  },
  upload: {
    maxFileSize: 5 * 1024 * 1024,
    documentosDir: "uploads/documentos",
    fotosDir: "uploads/fotos",
  },
};
