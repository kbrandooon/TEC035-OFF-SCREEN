import type { QuoteWithContext } from '../api/get-quote-by-lead-id'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const fmtMXN = (n: number) =>
  (n ?? 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })

function fmtDate(iso?: string): string {
  if (!iso) return new Date().toLocaleDateString('es-MX', { dateStyle: 'long' })
  return new Date(iso).toLocaleDateString('es-MX', { dateStyle: 'long' })
}

function fmtWindow(start: string, end: string): string {
  if (!start || !end) return '—'
  const s = new Date(start)
  const e = new Date(end)
  const dateFmt = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const timeFmt = new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })
  const sameDay = s.toDateString() === e.toDateString()
  if (sameDay) {
    return `${dateFmt.format(s)} · ${timeFmt.format(s)} – ${timeFmt.format(e)}`
  }
  return `${dateFmt.format(s)} ${timeFmt.format(s)}<br>al ${dateFmt.format(e)} ${timeFmt.format(e)}`
}

export function generateQuoteHTML(quote: QuoteWithContext): string {
  const shortId = quote.id ? quote.id.slice(0, 8).toUpperCase() : 'BORRADOR'
  const validUntilStr = quote.validUntil
    ? fmtDate(quote.validUntil)
    : (() => {
        const d = new Date()
        d.setDate(d.getDate() + 15)
        return d.toLocaleDateString('es-MX', { dateStyle: 'long' })
      })()

  const safeTenantName = escapeHtml(quote.tenantName || 'StudioOS')
  const safeClientName = escapeHtml(quote.clientName ?? '')
  const safeNotes = escapeHtml(quote.notes ?? '')
  const windowStr = fmtWindow(quote.windowStart, quote.windowEnd)

  // item.total already includes IVA — derive subtotal and tax backwards
  const totalAmount = (quote.items ?? []).reduce((acc, item) => acc + item.total, 0)
  const discountTotal = quote.discountTotal ?? 0
  const hasTax = quote.taxTotal > 0
  const subtotal = hasTax ? totalAmount / 1.16 : totalAmount
  const taxTotal = hasTax ? totalAmount - subtotal : 0

  // Hide unit price column when any item's total doesn't match unitPrice × quantity
  // (e.g. hourly pricing or manual overrides make the column misleading)
  const showUnitPrice = (quote.items ?? []).every(
    (item) => Math.abs(item.total - item.unitPrice * item.quantity) < 0.01
  )

  const itemRows = (quote.items ?? [])
    .map((item) => {
      const safeName = escapeHtml(item.name ?? '')
      const discountBadge = item.discount > 0
        ? `<span style="color:#d97706;font-size:10px;margin-left:4px;">-${item.discount}%</span>`
        : ''
      return `
      <tr>
        <td class="td-desc">${safeName}${discountBadge}</td>
        <td class="td-num">${item.quantity}</td>
        ${showUnitPrice ? `<td class="td-num">${fmtMXN(item.unitPrice)}</td>` : ''}
        <td class="td-total">${fmtMXN(item.total)}</td>
      </tr>`
    })
    .join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Cotización ${shortId} · ${safeTenantName}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      background: #f1f5f9;
      color: #1e293b;
      padding: 32px 20px;
    }

    .print-bar {
      max-width: 720px; margin: 0 auto 16px;
      display: flex; align-items: center; justify-content: space-between;
    }
    .print-bar span { font-size: 11px; color: #94a3b8; letter-spacing: 0.08em; text-transform: uppercase; }
    .print-btn {
      display: flex; align-items: center; gap: 6px;
      background: #1e293b; color: #fff; border: none;
      border-radius: 8px; padding: 8px 18px;
      font-size: 12px; font-weight: 700; cursor: pointer;
      letter-spacing: 0.04em; transition: background 0.15s;
    }
    .print-btn:hover { background: #334155; }
    @media print {
      .print-bar { display: none; }
      body { background: #fff; padding: 0; }
    }

    .paper {
      max-width: 720px; margin: 0 auto;
      background: #fff; border-radius: 12px;
      overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.10);
    }

    /* Header */
    .header {
      display: flex; justify-content: space-between; align-items: flex-start;
      padding: 36px 44px; border-bottom: 3px solid #1e293b;
    }
    .brand-name { font-size: 26px; font-weight: 900; letter-spacing: -0.02em; text-transform: uppercase; color: #1e293b; }
    .brand-sub { font-size: 10px; color: #94a3b8; margin-top: 4px; letter-spacing: 0.08em; text-transform: uppercase; }
    .doc-label { font-size: 32px; font-weight: 900; text-transform: uppercase; color: #e2e8f0; text-align: right; line-height: 1; }
    .doc-num { font-size: 13px; font-weight: 700; color: #64748b; text-align: right; margin-top: 6px; font-family: monospace; }
    .doc-date { font-size: 11px; color: #94a3b8; text-align: right; margin-top: 3px; }

    /* Info row */
    .info-row { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid #f1f5f9; }
    .info-cell { padding: 24px 44px; }
    .info-cell.border-r { border-right: 1px solid #f1f5f9; }
    .label { font-size: 8px; font-weight: 900; letter-spacing: 0.2em; text-transform: uppercase; color: #94a3b8; margin-bottom: 10px; }
    .client-name { font-size: 15px; font-weight: 700; color: #1e293b; }
    .client-meta { font-size: 12px; color: #64748b; margin-top: 6px; line-height: 1.7; }

    /* Table */
    .table-wrap { padding: 28px 44px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .th { padding-bottom: 10px; font-size: 9px; font-weight: 900; letter-spacing: 0.16em; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #1e293b; }
    .th-r { text-align: right; }
    .td-desc { padding: 12px 12px 12px 0; font-size: 13px; font-weight: 600; color: #1e293b; border-bottom: 1px solid #f1f5f9; }
    .td-num { padding: 12px 12px 12px 0; text-align: right; color: #475569; border-bottom: 1px solid #f1f5f9; font-variant-numeric: tabular-nums; }
    .td-total { padding: 12px 0; text-align: right; font-weight: 700; color: #1e293b; border-bottom: 1px solid #f1f5f9; font-variant-numeric: tabular-nums; }

    /* Totals */
    .totals { border-top: 1px solid #f1f5f9; padding: 20px 44px 32px; }
    .total-line { display: flex; justify-content: flex-end; gap: 48px; padding: 4px 0; font-size: 13px; color: #64748b; }
    .total-line .lbl { min-width: 120px; text-align: right; }
    .total-line .val { font-weight: 600; color: #334155; font-variant-numeric: tabular-nums; min-width: 110px; text-align: right; }
    .grand { display: flex; justify-content: flex-end; gap: 48px; align-items: center; background: #1e293b; color: #fff; padding: 14px 24px; border-radius: 10px; margin-top: 12px; }
    .grand-lbl { font-size: 11px; font-weight: 900; letter-spacing: 0.18em; text-transform: uppercase; min-width: 120px; text-align: right; }
    .grand-val { font-size: 22px; font-weight: 900; font-variant-numeric: tabular-nums; min-width: 110px; text-align: right; }

    /* Notes */
    .notes { border-top: 1px solid #f8fafc; padding: 20px 44px 24px; }
    .notes-text { font-size: 12px; line-height: 1.8; color: #64748b; white-space: pre-wrap; }

    /* Terms */
    .terms { border-top: 1px solid #f1f5f9; padding: 20px 44px; background: #fafbfc; }
    .terms-title { font-size: 9px; font-weight: 900; letter-spacing: 0.2em; text-transform: uppercase; color: #94a3b8; margin-bottom: 10px; }
    .terms-list { list-style: none; }
    .terms-list li { font-size: 10px; color: #94a3b8; padding: 2px 0; }
    .terms-list li::before { content: "·  "; }

    /* Footer */
    .footer { background: #1e293b; padding: 14px 44px; display: flex; justify-content: space-between; align-items: center; }
    .footer-brand { font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: 0.06em; }
    .footer-sign { font-size: 10px; color: #475569; }
  </style>
</head>
<body>

  <div class="print-bar">
    <span>Cotización · ${safeTenantName}</span>
    <button class="print-btn" onclick="window.print()">⬇ Guardar como PDF</button>
  </div>

  <div class="paper">

    <!-- HEADER -->
    <div class="header">
      <div>
        <p class="brand-name">${safeTenantName}</p>
        <p class="brand-sub">Cotización oficial</p>
      </div>
      <div>
        <p class="doc-label">Cotización</p>
        <p class="doc-num">#${shortId}</p>
        <p class="doc-date">Emitida: ${fmtDate()}</p>
        <p class="doc-date">Válida hasta: ${validUntilStr}</p>
      </div>
    </div>

    <!-- INFO ROW -->
    <div class="info-row">
      <div class="info-cell border-r">
        <p class="label">Cliente</p>
        <p class="client-name">${safeClientName || '—'}</p>
      </div>
      <div class="info-cell">
        <p class="label">Ventana de tiempo solicitada</p>
        <p class="client-meta">${windowStr}</p>
      </div>
    </div>

    <!-- ITEMS TABLE -->
    <div class="table-wrap">
      ${
        (quote.items ?? []).length === 0
          ? `<p style="text-align:center;color:#cbd5e1;padding:32px 0;font-size:12px;">Sin artículos en esta cotización.</p>`
          : `<table>
              <thead>
                <tr>
                  <th class="th" style="text-align:left;">Descripción</th>
                  <th class="th th-r">Cant.</th>
                  ${showUnitPrice ? `<th class="th th-r">Precio Unit.</th>` : ''}
                  <th class="th th-r">Total</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>`
      }
    </div>

    <!-- TOTALS -->
    <div class="totals">
      <div class="total-line">
        <span class="lbl">Subtotal</span>
        <span class="val">${fmtMXN(subtotal)}</span>
      </div>
      ${
        discountTotal > 0
          ? `<div class="total-line">
               <span class="lbl">Descuento</span>
               <span class="val" style="color:#d97706;">-${fmtMXN(discountTotal)}</span>
             </div>`
          : ''
      }
      ${
        taxTotal > 0
          ? `<div class="total-line">
               <span class="lbl">IVA (16%)</span>
               <span class="val">${fmtMXN(taxTotal)}</span>
             </div>`
          : ''
      }
      <div class="grand">
        <span class="grand-lbl">Total</span>
        <span class="grand-val">${fmtMXN(totalAmount)}</span>
      </div>
    </div>

    ${
      safeNotes
        ? `<div class="notes">
             <p class="label">Notas</p>
             <p class="notes-text">${safeNotes}</p>
           </div>`
        : ''
    }

    <!-- TERMS -->
    <div class="terms">
      <p class="terms-title">Términos y Condiciones</p>
      <ul class="terms-list">
        <li>Esta cotización tiene una vigencia de 15 días naturales a partir de su fecha de emisión.</li>
        <li>Los precios están sujetos a cambios si el proyecto sufre modificaciones en tiempos o requerimientos.</li>
        <li>El equipo reservado está sujeto a disponibilidad hasta la confirmación mediante anticipo.</li>
        <li>El anticipo requerido para confirmar la reserva es del 50% del total.</li>
      </ul>
    </div>

    <!-- FOOTER -->
    <div class="footer">
      <span class="footer-brand">${safeTenantName} · Cotización Oficial</span>
      <span class="footer-sign">¡Gracias por crear con nosotros!</span>
    </div>

  </div>
</body>
</html>`
}

export function openQuoteDocument(quote: QuoteWithContext): void {
  const html = generateQuoteHTML(quote)
  const blob = new Blob([html], { type: 'text/html; charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const tab = window.open(url, '_blank')
  if (tab) {
    tab.addEventListener('load', () => URL.revokeObjectURL(url), { once: true })
  } else {
    URL.revokeObjectURL(url)
  }
}
