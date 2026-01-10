function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/**
 * @param {object} p pedido
 * @param {object} helpers
 * @param {function(object):string} helpers.displayId
 * @param {function(object):string|null} helpers.customerName
 * @param {function(object):string|null} helpers.customerPhone
 * @param {function(object):string} helpers.statusLabel
 * @param {function(object):string|null} helpers.formatDateTime
 * @param {function(object):string} helpers.formatTotal
 * @param {function(object):string|null} helpers.addressText
 * @param {function(object):Array} helpers.pedidoItems
 * @param {function(object):number|string} helpers.itemQty
 * @param {function(object):string} helpers.itemName
 * @param {function(object):string|null} helpers.itemObs
 * @param {function(object):string} helpers.itemPriceText
 */
function buildPrintHtml(p, helpers) {
  const items = helpers.pedidoItems?.(p) ?? [];
  const itemsHtml = items
    .map((it) => {
      const obs = helpers.itemObs?.(it)
        ? `<div class="muted">${escapeHtml(helpers.itemObs(it))}</div>`
        : "";
      return `
        <div class="row">
          <div class="col left">
            <div><strong>${escapeHtml(String(helpers.itemQty?.(it) ?? 1))}x</strong> ${escapeHtml(
        helpers.itemName?.(it) ?? "Item"
      )}</div>
            ${obs}
          </div>
          <div class="col right">${escapeHtml(helpers.itemPriceText?.(it) ?? "")}</div>
        </div>
      `;
    })
    .join("");

  return `
<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Impressão - Pedido ${escapeHtml(helpers.displayId?.(p) ?? "-")}</title>
<style>
  body{font-family: Arial, Helvetica, sans-serif; padding:16px; color:#111}
  .title{font-size:18px; font-weight:700; margin-bottom:8px}
  .muted{color:#666; font-size:12px; margin-top:2px}
  .row{display:flex; justify-content:space-between; gap:12px; padding:8px 0; border-bottom:1px dashed #ddd}
  .row:last-child{border-bottom:0}
  .col.left{flex:1}
  .col.right{min-width:90px; text-align:right}
  .box{border:1px solid #eee; border-radius:10px; padding:12px; margin-top:10px}
  .kv{display:flex; justify-content:space-between; gap:12px; padding:6px 0}
  .kv .k{color:#666}
  .total{font-size:16px; font-weight:700}
  @media print { .no-print{display:none} }
</style>
</head>
<body>
  <div class="title">Pedido ${escapeHtml(helpers.displayId?.(p) ?? "-")}</div>
  <div class="muted">${escapeHtml(helpers.formatDateTime?.(p) ?? "")}</div>

  <div class="box">
    <div class="kv"><div class="k">Cliente</div><div>${escapeHtml(helpers.customerName?.(p) ?? "-")}</div></div>
    <div class="kv"><div class="k">Telefone</div><div>${escapeHtml(helpers.customerPhone?.(p) ?? "-")}</div></div>
    <div class="kv"><div class="k">Status</div><div>${escapeHtml(helpers.statusLabel?.(p) ?? "-")}</div></div>
  </div>

  <div class="box">
    <div class="muted" style="margin-bottom:6px">Itens</div>
    ${itemsHtml || `<div class="muted">Sem itens</div>`}
    <div class="row">
      <div class="col left total">Total</div>
      <div class="col right total">${escapeHtml(helpers.formatTotal?.(p) ?? "")}</div>
    </div>
  </div>

  <div class="box">
    <div class="muted">Endereço / Observações</div>
    <div style="white-space:pre-wrap; margin-top:6px">${escapeHtml(helpers.addressText?.(p) ?? "—")}</div>
  </div>

  <div class="no-print" style="margin-top:14px">
    <button onclick="window.print()" style="padding:10px 12px">Imprimir</button>
    <button onclick="window.close()" style="padding:10px 12px; margin-left:8px">Fechar</button>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Abre janela e imprime.
 * @param {object} pedido
 * @param {object} options
 * @param {boolean} options.auto
 * @param {object} options.helpers (mesmo formato do buildPrintHtml)
 */
export function printPedido(pedido, { auto = true, helpers } = {}) {
  if (!pedido) return false;
  if (!helpers) throw new Error("printPedido: helpers é obrigatório");

  const html = buildPrintHtml(pedido, helpers);
  const w = window.open("", "_blank", "noopener,noreferrer,width=420,height=650");
  if (!w) return false;

  w.document.open();
  w.document.write(html);
  w.document.close();

  if (auto) {
    setTimeout(() => {
      try {
        w.focus();
        w.print();
      } catch (err) {
        console.warn("Falha ao imprimir automaticamente", err);
      }
    }, 350);
  }

  return true;
}
