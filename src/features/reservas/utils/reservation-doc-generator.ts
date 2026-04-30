import type { ReservationFormValues } from '../types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

function formatDate(iso: string) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} de ${MONTHS[m - 1]} de ${y}`
}

function fmt24to12(t: string) {
  if (!t) return '—'
  const [h, min] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(min).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

function calcDays(start: string, end: string) {
  if (!start || !end) return 1
  const diff = new Date(end).getTime() - new Date(start).getTime()
  return Math.max(Math.round(diff / 86_400_000) + 1, 1)
}

function calcHours(start: string, end: string) {
  if (!start || !end) return 0
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return Math.max(0, (eh * 60 + em - (sh * 60 + sm)) / 60)
}

const fmtMXN = (n: number) =>
  n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })

// ─── Generator ────────────────────────────────────────────────────────────────

/**
 * Generates a self-contained HTML document string that is a faithful
 * rendering of the `ReservationPreview` React component — same layout,
 * same labels, same colour scheme — using inline CSS so it renders
 * identically in any browser tab or print dialog.
 *
 * Used by the "Abrir documento" button in `ReservationDetailModal` to open
 * a new tab where the user can review and print/save as PDF.
 *
 * @param values - Reservation form values (or any Reservation, which extends it).
 * @returns Full `<!DOCTYPE html>` string.
 */
export function generateReservationHTML(values: ReservationFormValues): string {
  const days = calcDays(values.date, values.endDate)
  const hours = calcHours(values.startTime, values.endTime)
  const multiDay = days > 1

  const safeClientName = escapeHtml(values.clientName ?? '')
  const safeAddress = escapeHtml(values.address ?? '')
  const safeNotes = escapeHtml(values.notes ?? '')

  const equipSub = values.equipmentItems.reduce(
    (acc, item) => acc + item.quantity * item.daily_rate * days,
    0
  )
  const iva = values.requiresInvoice ? equipSub * 0.16 : 0
  const total = equipSub + iva

  const scheduleHtml = multiDay
    ? `<p class="detail-main">${formatDate(values.date)}</p>
       <p class="detail-sub">al ${formatDate(values.endDate)} · ${days} día${days !== 1 ? 's' : ''}</p>`
    : `<p class="detail-main">${formatDate(values.date)}</p>
       ${
         values.startTime
           ? `<p class="detail-sub">${fmt24to12(values.startTime)} – ${fmt24to12(values.endTime)}${hours > 0 ? ` · ${hours.toFixed(1)} hrs` : ''}</p>`
           : ''
       }`

  const equipRows = values.equipmentItems
    .map((item) => {
      const safeName = escapeHtml(item.name ?? '')
      const safeImgUrl = item.image_url
        ? escapeHtml(item.image_url).replace(/^javascript:/i, '')
        : null
      return `
    <tr>
      <td class="td-thumb">
        ${
          safeImgUrl
            ? `<img src="${safeImgUrl}" alt="${safeName}" class="thumb" />`
            : `<div class="thumb-ph">🎥</div>`
        }
      </td>
      <td class="td-desc">${safeName}</td>
      <td class="td-num">${multiDay ? `${item.quantity} × ${days}` : item.quantity}</td>
      <td class="td-num">${item.daily_rate > 0 ? fmtMXN(item.daily_rate) : '—'}</td>
      <td class="td-total">${item.daily_rate > 0 ? fmtMXN(item.quantity * item.daily_rate * days) : '—'}</td>
    </tr>`
    })
    .join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reserva —  StudioOS</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      background: #f1f5f9;
      color: #1e293b;
      padding: 32px 20px;
    }

    /* ── Print bar ── */
    .print-bar {
      max-width: 660px;
      margin: 0 auto 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .print-bar span { font-size: 11px; color: #94a3b8; letter-spacing: 0.08em; text-transform: uppercase; }
    .print-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #1e293b;
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 8px 16px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      letter-spacing: 0.04em;
      transition: background 0.15s;
    }
    .print-btn:hover { background: #334155; }
    @media print { .print-bar { display: none; } body { background: #fff; padding: 0; } }

    /* ── Paper ── */
    .paper {
      max-width: 660px;
      margin: 0 auto;
      background: #fff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0,0,0,0.10);
    }

    /* ── Header ── */
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #f1f5f9; padding: 28px 36px; }
    .brand-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    .brand-name { font-size: 13px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: #1e293b; }
    .brand-light { font-size: 13px; font-weight: 300; letter-spacing: 0.1em; color: #94a3b8; }
    .brand-sub { font-size: 9px; color: #94a3b8; margin-top: 2px; }
    .doc-title { font-size: 28px; font-weight: 900; text-transform: uppercase; color: #e2e8f0; text-align: right; }
    .doc-num { font-size: 11px; font-weight: 700; color: #64748b; text-align: right; margin-top: 4px; }
    .doc-date { font-size: 10px; color: #94a3b8; text-align: right; margin-top: 2px; }

    /* ── Info row ── */
    .info-row { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid #f1f5f9; }
    .info-cell { padding: 20px 36px; }
    .info-cell.border-r { border-right: 1px solid #f1f5f9; }
    .label { font-size: 8px; font-weight: 900; letter-spacing: 0.2em; text-transform: uppercase; color: #94a3b8; margin-bottom: 8px; }
    .client-name { font-size: 13px; font-weight: 700; color: #1e293b; }
    .client-addr { font-size: 11px; color: #64748b; margin-top: 3px; line-height: 1.5; }
    .detail-main { font-size: 13px; font-weight: 700; color: #1e293b; }
    .detail-sub { font-size: 11px; color: #64748b; margin-top: 3px; }
    .invoice-flag { font-size: 10px; font-weight: 600; color: #d97706; margin-top: 6px; }

    /* ── Table ── */
    .table-wrap { padding: 20px 36px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .th { padding-bottom: 8px; font-size: 9px; font-weight: 900; letter-spacing: 0.14em; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #1e293b; }
    .th-r { text-align: right; }
    .td-thumb { padding: 10px 8px 10px 0; width: 36px; border-bottom: 1px solid #f8fafc; }
    .td-desc { padding: 10px 12px 10px 0; font-size: 12px; font-weight: 600; color: #1e293b; border-bottom: 1px solid #f8fafc; }
    .td-num { padding: 10px 12px 10px 0; text-align: right; color: #475569; border-bottom: 1px solid #f8fafc; font-variant-numeric: tabular-nums; }
    .td-total { padding: 10px 0; text-align: right; font-weight: 700; color: #1e293b; border-bottom: 1px solid #f8fafc; font-variant-numeric: tabular-nums; }
    .thumb { width: 28px; height: 28px; border-radius: 6px; object-fit: cover; display: block; }
    .thumb-ph { width: 28px; height: 28px; border-radius: 6px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 13px; }
    .no-items { padding: 32px; text-align: center; font-size: 11px; color: #cbd5e1; }

    /* ── Totals ── */
    .totals { border-top: 1px solid #f1f5f9; padding: 16px 36px 28px; }
    .total-line { display: flex; justify-content: space-between; padding: 3px 0; font-size: 12px; color: #64748b; }
    .total-line .val { font-weight: 600; color: #334155; font-variant-numeric: tabular-nums; }
    .grand { display: flex; justify-content: space-between; align-items: center; background: #1e293b; color: #fff; padding: 12px 20px; border-radius: 8px; margin-top: 10px; }
    .grand-lbl { font-size: 10px; font-weight: 900; letter-spacing: 0.18em; text-transform: uppercase; }
    .grand-val { font-size: 20px; font-weight: 900; font-variant-numeric: tabular-nums; }

    /* ── Notes ── */
    .notes { border-top: 1px solid #f8fafc; padding: 16px 36px 20px; }
    .notes-text { font-size: 11px; line-height: 1.7; color: #64748b; white-space: pre-wrap; }

    /* ── Footer ── */
    .footer { background: #f8fafc; border-top: 1px solid #f1f5f9; padding: 10px 36px; }
    .footer-txt { font-size: 9px; color: #94a3b8; }
  </style>
</head>
<body>

  <!-- Print bar (hidden on print) -->
  <div class="print-bar">
    <span>Documento de Reservación</span>
    <button class="print-btn" onclick="window.print()">
      ⬇ Guardar / Imprimir
    </button>
  </div>

  <div class="paper">

    <!-- HEADER -->
    <div class="header">
      <div>
        <div class="brand-row">
          <span>🎬</span>
          <span class="brand-name">StudioOS</span>
          <span class="brand-light">Studio</span>
        </div>
        <p class="brand-sub">estudio@studioos.mx</p>
        <p class="brand-sub">Guadalajara, Jalisco · MX</p>
      </div>
      <div>
        <p class="doc-title">Reserva</p>
        <p class="doc-num">R-#####</p>
        <p class="doc-date">${values.date ? formatDate(values.date) : '—'}</p>
      </div>
    </div>

    <!-- INFO ROW -->
    <div class="info-row">
      <div class="info-cell border-r">
        <p class="label">Reservado por:</p>
        <p class="client-name">${safeClientName || '—'}</p>
        ${safeAddress ? `<p class="client-addr">${safeAddress}</p>` : ''}
      </div>
      <div class="info-cell">
        <p class="label">Detalles</p>
        ${scheduleHtml}
        ${values.requiresInvoice ? `<p class="invoice-flag">· Factura requerida (IVA 16%)</p>` : ''}
      </div>
    </div>

    <!-- EQUIPMENT TABLE -->
    <div class="table-wrap">
      ${
        values.equipmentItems.length === 0
          ? `<div class="no-items">Sin equipo seleccionado</div>`
          : `<table>
             <thead>
               <tr>
                 <th class="th" colspan="2">Descripción</th>
                 <th class="th th-r">Cant.${multiDay ? '/Días' : ''}</th>
                 <th class="th th-r">Tarifa/día</th>
                 <th class="th th-r">Total</th>
               </tr>
             </thead>
             <tbody>${equipRows}</tbody>
           </table>`
      }
    </div>

    <!-- TOTALS -->
    <div class="totals">
      <div class="total-line">
        <span>Subtotal</span>
        <span class="val">${fmtMXN(equipSub)}</span>
      </div>
      ${
        values.requiresInvoice
          ? `
      <div class="total-line">
        <span>IVA (16%)</span>
        <span class="val">${fmtMXN(iva)}</span>
      </div>`
          : ''
      }
      <div class="grand">
        <span class="grand-lbl">Total</span>
        <span class="grand-val">${fmtMXN(total)}</span>
      </div>
    </div>

    ${
      values.notes
        ? `
    <!-- NOTES -->
    <div class="notes">
      <p class="label">Notas</p>
      <p class="notes-text">${safeNotes}</p>
    </div>`
        : ''
    }

    <!-- FOOTER -->
    <div class="footer">
      <p class="footer-txt">StudioOS · Orden de Reservación</p>
    </div>

  </div>
</body>
</html>`
}

/**
 * Opens the reservation HTML document in a new browser tab.
 * The tab renders the same document seen in the live preview,
 * with a Print/Save button at the top.
 *
 * @param values - Reservation form values.
 */
export function openReservationDocument(values: ReservationFormValues): void {
  const html = generateReservationHTML(values)
  const blob = new Blob([html], { type: 'text/html; charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const tab = window.open(url, '_blank')
  if (tab) {
    tab.addEventListener('load', () => URL.revokeObjectURL(url), { once: true })
  } else {
    URL.revokeObjectURL(url)
  }
}
