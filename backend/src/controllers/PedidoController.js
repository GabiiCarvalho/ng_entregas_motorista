const db = require("../config/database");

class PedidoController {
  static async listarDisponiveis(req, res) {
    try {
      const [pedidos] = await db.query(
        `SELECT p.id, p.coleta_endereco as coleta, p.coleta_lat, p.coleta_lng,
                p.entrega_endereco as entrega, p.entrega_lat, p.entrega_lng,
                p.valor_base as valor, p.forma_pagamento,
                u.nome as usuario_nome
         FROM pedidos p
         JOIN usuarios u ON u.id = p.usuario_id
         WHERE p.status = 'aguardando' AND p.motorista_id IS NULL
         ORDER BY p.criado_em DESC LIMIT 10`,
      );
      res.json({ ok: true, pedidos });
    } catch (error) {
      res.status(500).json({ ok: false, msg: "Erro ao listar pedidos" });
    }
  }

  static async aceitar(req, res) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [pedido] = await conn.query(
        'SELECT * FROM pedidos WHERE id = ? AND status = "aguardando" AND motorista_id IS NULL',
        [req.params.id],
      );

      if (pedido.length === 0) {
        await conn.rollback();
        return res
          .status(404)
          .json({ ok: false, msg: "Pedido não disponível" });
      }

      await conn.query(
        'UPDATE pedidos SET motorista_id = ?, status = "aceito", aceito_em = NOW() WHERE id = ?',
        [req.user.id, req.params.id],
      );

      await conn.commit();

      const [atualizado] = await db.query(
        "SELECT * FROM pedidos WHERE id = ?",
        [req.params.id],
      );
      res.json({ ok: true, msg: "Pedido aceito!", pedido: atualizado[0] });
    } catch (error) {
      await conn.rollback();
      res.status(500).json({ ok: false, msg: "Erro ao aceitar pedido" });
    } finally {
      conn.release();
    }
  }

  static async atualizarStatus(req, res) {
    const conn = await db.getConnection();
    try {
      const { status } = req.body;
      const validos = ["coletando", "em_rota", "entregue", "cancelado"];

      if (!validos.includes(status)) {
        return res.status(400).json({ ok: false, msg: "Status inválido" });
      }

      await conn.beginTransaction();

      const [pedido] = await conn.query(
        "SELECT * FROM pedidos WHERE id = ? AND motorista_id = ?",
        [req.params.id, req.user.id],
      );

      if (pedido.length === 0) {
        await conn.rollback();
        return res
          .status(404)
          .json({ ok: false, msg: "Pedido não encontrado" });
      }

      const updateFields = ["status = ?"];
      const updateValues = [status];

      if (status === "coletando") {
        updateFields.push("chegada_coleta_em = NOW()");
      } else if (status === "em_rota") {
        updateFields.push("saida_coleta_em = NOW()");
        const [espera] = await conn.query(
          "SELECT TIMESTAMPDIFF(SECOND, chegada_coleta_em, NOW()) as tempo FROM pedidos WHERE id = ?",
          [req.params.id],
        );
        if (espera[0]) {
          updateFields.push("tempo_espera_segundos = ?");
          updateValues.push(espera[0].tempo);
        }
      } else if (status === "entregue") {
        updateFields.push("entregue_em = NOW()");
      } else if (status === "cancelado") {
        updateFields.push("cancelado_em = NOW()");
        updateFields.push("cancelado_por = ?");
        updateValues.push("motorista");
      }

      updateValues.push(req.params.id, req.user.id);

      await conn.query(
        `UPDATE pedidos SET ${updateFields.join(", ")} WHERE id = ? AND motorista_id = ?`,
        updateValues,
      );

      if (status === "entregue") {
        await PedidoController.registrarCorrida(
          req.params.id,
          req.user.id,
          conn,
        );
      }

      await conn.commit();
      res.json({ ok: true, msg: `Status atualizado: ${status}` });
    } catch (error) {
      await conn.rollback();
      res.status(500).json({ ok: false, msg: "Erro ao atualizar status" });
    } finally {
      conn.release();
    }
  }

  static async registrarCorrida(pedidoId, motoristaId, conn) {
    const [pedido] = await conn.query(
      "SELECT p.*, u.nome as cliente_nome FROM pedidos p JOIN usuarios u ON u.id = p.usuario_id WHERE p.id = ?",
      [pedidoId],
    );

    if (pedido.length === 0) return;

    const p = pedido[0];
    const distancia = PedidoController.calcularDistancia(
      p.coleta_lat,
      p.coleta_lng,
      p.entrega_lat,
      p.entrega_lng,
    );

    await conn.query(
      "INSERT INTO corridas (motorista_id, pedido_id, cliente_nome, coleta, entrega, distancia_km, duracao_min, valor, metodo_pagamento) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        motoristaId,
        pedidoId,
        p.cliente_nome,
        p.coleta_endereco,
        p.entrega_endereco,
        distancia.toFixed(2),
        Math.ceil((distancia / 25) * 60),
        p.valor_total || p.valor_base,
        p.forma_pagamento,
      ],
    );

    const hoje = new Date().toISOString().split("T")[0];
    const valor = p.valor_total || p.valor_base;
    const taxaApp = valor * 0.15;

    await conn.query(
      "INSERT INTO ganhos_diarios (motorista_id, data, bruto, taxa_app, liquido, num_corridas) VALUES (?, ?, ?, ?, ?, 1) ON DUPLICATE KEY UPDATE bruto = bruto + VALUES(bruto), taxa_app = taxa_app + VALUES(taxa_app), liquido = liquido + VALUES(liquido), num_corridas = num_corridas + 1",
      [motoristaId, hoje, valor, taxaApp, valor - taxaApp],
    );

    await conn.query(
      "UPDATE motoristas SET total_corridas = total_corridas + 1 WHERE id = ?",
      [motoristaId],
    );
  }

  static calcularDistancia(lat1, lng1, lat2, lng2) {
    if (!lat1 || !lng1 || !lat2 || !lng2) return 0;
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}

module.exports = PedidoController;
