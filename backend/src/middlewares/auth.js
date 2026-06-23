const jwt = require("jsonwebtoken");
const config = require("../config");

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ ok: false, msg: "Token não fornecido" });
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2) {
    return res.status(401).json({ ok: false, msg: "Token mal formatado" });
  }

  const [scheme, token] = parts;
  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).json({ ok: false, msg: "Token mal formatado" });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = { id: decoded.id, tipo: decoded.tipo };
    return next();
  } catch (err) {
    return res
      .status(401)
      .json({ ok: false, msg: "Token inválido ou expirado" });
  }
}

module.exports = authMiddleware;
