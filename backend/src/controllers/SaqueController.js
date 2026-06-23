const db = require("../config/database");

class SaqueController {
  static async listar(req, res) {
    try {
      const [saques] = await db.query(
        "SELECT * FROM saques WHERE motorista_id = ? ORDER BY criado_em DESC LIMIT 20",
        [req.user.id],
      );
      res.json({ ok: true, saques });
    } catch (error) {
      res.status(500).json({ ok: false, msg: "Erro ao listar saques" });
    }
  }

  static async solicitar(req, res) {
    try {
      const { valor, chave_pix } = req.body;

      if (!valor || valor < 20) {
        return res
          .status(400)
          .json({ ok: false, msg: "Valor mínimo: R$20,00" });
      }

      const hoje = new Date().toISOString().split("T")[0];
      const [ganhos] = await db.query(
        "SELECT liquido FROM ganhos_diarios WHERE motorista_id = ? AND data = ?",
        [req.user.id, hoje],
      );
      const saldo = ganhos[0]?.liquido || 0;

      if (valor > saldo) {
        return res
          .status(400)
          .json({
            ok: false,
            msg: `Saldo insuficiente: R$${saldo.toFixed(2)}`,
          });
      }

      const [result] = await db.query(
        "INSERT INTO saques (motorista_id, valor, chave_pix) VALUES (?, ?, ?)",
        [req.user.id, valor, chave_pix],
      );
      res.json({
        ok: true,
        msg: "Saque solicitado! Prazo: 1-2 dias úteis.",
        saque_id: result.insertId,
      });
    } catch (error) {
      res.status(500).json({ ok: false, msg: "Erro ao solicitar saque" });
    }
  }
}

module.exports = SaqueController;
