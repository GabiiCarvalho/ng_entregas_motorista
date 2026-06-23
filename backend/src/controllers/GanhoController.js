const db = require("../config/database");

class GanhoController {
  static async hoje(req, res) {
    try {
      const hoje = new Date().toISOString().split("T")[0];
      const [rows] = await db.query(
        "SELECT * FROM ganhos_diarios WHERE motorista_id = ? AND data = ?",
        [req.user.id, hoje],
      );

      const ganho = rows[0] || {
        bruto: 0,
        taxa_app: 0,
        liquido: 0,
        num_corridas: 0,
        taxa_paga: false,
      };
      res.json({ ok: true, ganho });
    } catch (error) {
      res.status(500).json({ ok: false, msg: "Erro ao buscar ganhos" });
    }
  }

  static async semana(req, res) {
    try {
      const [rows] = await db.query(
        "SELECT * FROM ganhos_diarios WHERE motorista_id = ? AND data >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) ORDER BY data DESC",
        [req.user.id],
      );
      res.json({ ok: true, semana: rows });
    } catch (error) {
      res.status(500).json({ ok: false, msg: "Erro ao buscar ganhos" });
    }
  }

  static async pagarTaxa(req, res) {
    try {
      const hoje = new Date().toISOString().split("T")[0];
      await db.query(
        "UPDATE ganhos_diarios SET taxa_paga = TRUE WHERE motorista_id = ? AND data = ?",
        [req.user.id, hoje],
      );
      res.json({ ok: true, msg: "Taxa paga!" });
    } catch (error) {
      res.status(500).json({ ok: false, msg: "Erro ao pagar taxa" });
    }
  }
}

module.exports = GanhoController;
