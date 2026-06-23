const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/database");
const config = require("../config");

class AuthController {
  static async register(req, res) {
    try {
      const { nome, email, telefone, cpf, senha, data_nascimento } = req.body;

      const [existing] = await db.query(
        "SELECT id FROM motoristas WHERE email = ? OR telefone = ? OR cpf = ?",
        [email, telefone, cpf],
      );

      if (existing.length > 0) {
        return res
          .status(409)
          .json({ ok: false, msg: "Email, telefone ou CPF já cadastrado" });
      }

      const senha_hash = await bcrypt.hash(senha, 10);

      const [result] = await db.query(
        "INSERT INTO motoristas (nome, email, telefone, cpf, senha_hash, data_nascimento) VALUES (?, ?, ?, ?, ?, ?)",
        [nome, email, telefone, cpf, senha_hash, data_nascimento],
      );

      const token = jwt.sign(
        { id: result.insertId, tipo: "motorista" },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn },
      );

      res.status(201).json({
        ok: true,
        msg: "Cadastro realizado!",
        token,
        motorista: {
          id: result.insertId,
          nome,
          email,
          telefone,
          face_ok: false,
          avaliacao: 5.0,
          total_corridas: 0,
        },
      });
    } catch (error) {
      console.error("Erro no cadastro:", error);
      res.status(500).json({ ok: false, msg: "Erro ao cadastrar" });
    }
  }

  static async login(req, res) {
    try {
      const { telefone, senha } = req.body;

      const [rows] = await db.query(
        'SELECT * FROM motoristas WHERE telefone = ? AND status = "ativo"',
        [telefone],
      );

      if (rows.length === 0) {
        return res
          .status(401)
          .json({ ok: false, msg: "Telefone ou senha incorretos" });
      }

      const motorista = rows[0];
      const senhaValida = await bcrypt.compare(senha, motorista.senha_hash);

      if (!senhaValida) {
        return res
          .status(401)
          .json({ ok: false, msg: "Telefone ou senha incorretos" });
      }

      const token = jwt.sign(
        { id: motorista.id, tipo: "motorista" },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn },
      );

      await db.query(
        "UPDATE motoristas SET ultimo_login = NOW() WHERE id = ?",
        [motorista.id],
      );

      const { senha_hash, ...data } = motorista;

      res.json({ ok: true, token, motorista: data });
    } catch (error) {
      console.error("Erro no login:", error);
      res.status(500).json({ ok: false, msg: "Erro ao fazer login" });
    }
  }

  static async perfil(req, res) {
    try {
      const [rows] = await db.query(
        "SELECT id, nome, email, telefone, cpf, data_nascimento, foto_url, face_ok, avaliacao, total_corridas, cnh_status, crlv_status, online, lat, lng FROM motoristas WHERE id = ?",
        [req.user.id],
      );

      if (rows.length === 0) {
        return res
          .status(404)
          .json({ ok: false, msg: "Motorista não encontrado" });
      }

      res.json({ ok: true, motorista: rows[0] });
    } catch (error) {
      console.error("Erro ao buscar perfil:", error);
      res.status(500).json({ ok: false, msg: "Erro ao buscar perfil" });
    }
  }

  static async verificarFace(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ ok: false, msg: "Nenhuma foto enviada" });
      }

      await db.query(
        "UPDATE motoristas SET face_ok = TRUE, face_verificada_em = NOW() WHERE id = ?",
        [req.user.id],
      );

      res.json({ ok: true, msg: "Verificação facial realizada!" });
    } catch (error) {
      console.error("Erro na verificação facial:", error);
      res.status(500).json({ ok: false, msg: "Erro na verificação facial" });
    }
  }

  static async uploadDocumento(req, res) {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ ok: false, msg: "Nenhum arquivo enviado" });
      }

      const { tipo } = req.body;
      const url = `/uploads/documentos/${req.file.filename}`;

      await db.query(
        "INSERT INTO documentos_motorista (motorista_id, tipo, url, nome_original) VALUES (?, ?, ?, ?)",
        [req.user.id, tipo, url, req.file.originalname],
      );

      const statusField = tipo === "cnh" ? "cnh_status" : "crlv_status";
      await db.query(
        `UPDATE motoristas SET ${statusField} = 'pendente' WHERE id = ?`,
        [req.user.id],
      );

      res.json({ ok: true, msg: "Documento enviado!", url });
    } catch (error) {
      console.error("Erro no upload:", error);
      res.status(500).json({ ok: false, msg: "Erro ao enviar documento" });
    }
  }

  static async uploadFoto(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ ok: false, msg: "Nenhuma foto enviada" });
      }

      const fotoUrl = `/uploads/fotos/${req.file.filename}`;
      await db.query("UPDATE motoristas SET foto_url = ? WHERE id = ?", [
        fotoUrl,
        req.user.id,
      ]);

      res.json({ ok: true, msg: "Foto atualizada!", foto_url: fotoUrl });
    } catch (error) {
      console.error("Erro no upload de foto:", error);
      res.status(500).json({ ok: false, msg: "Erro ao enviar foto" });
    }
  }

  static async atualizarLocalizacao(req, res) {
    try {
      const { lat, lng, online } = req.body;
      await db.query(
        "UPDATE motoristas SET lat = ?, lng = ?, online = ?, ultima_localizacao = NOW() WHERE id = ?",
        [lat, lng, online, req.user.id],
      );
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ ok: false, msg: "Erro ao atualizar" });
    }
  }
}

module.exports = AuthController;
