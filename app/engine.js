/* Sesenta · motor de cálculo. Funciones puras, sin DOM.
   Ley 3/2004: interés de demora = tipo BCE + 8 puntos, publicado cada semestre en el BOE. */
var Sesenta = (function () {
  'use strict';
  var DAY = 86400000;

  // Tipo legal de interés de demora (% anual) por semestre natural.
  // Fuente: tabla del Banco de España (Portal del Cliente Bancario) y BOE-A-2026-14327 para 2026-2.
  var RATES = {
    '2015-1': 8.05, '2015-2': 8.05, '2016-1': 8.05, '2016-2': 8.00,
    '2017-1': 8.00, '2017-2': 8.00, '2018-1': 8.00, '2018-2': 8.00,
    '2019-1': 8.00, '2019-2': 8.00, '2020-1': 8.00, '2020-2': 8.00,
    '2021-1': 8.00, '2021-2': 8.00, '2022-1': 8.00, '2022-2': 8.00,
    '2023-1': 10.50, '2023-2': 12.00, '2024-1': 12.50, '2024-2': 12.25,
    '2025-1': 11.15, '2025-2': 10.15, '2026-1': 10.15, '2026-2': 10.40
  };
  var FIRST_YEAR = 2015;
  var MAX_TERM = 60;      // art. 4.3: el plazo pactado no puede superar 60 días naturales
  var DEFAULT_TERM = 30;  // art. 4.1: 30 días naturales si no hay pacto
  var FIXED_COST = 40;    // art. 8.1: 40 € por factura

  function toDay(iso) {
    if (typeof iso !== 'string') return NaN;
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!m) return NaN;
    var y = +m[1], mo = +m[2], d = +m[3];
    var t = Date.UTC(y, mo - 1, d);
    var dt = new Date(t);
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return NaN;
    return Math.round(t / DAY);
  }
  function toIso(day) {
    var dt = new Date(day * DAY);
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return dt.getUTCFullYear() + '-' + p(dt.getUTCMonth() + 1) + '-' + p(dt.getUTCDate());
  }
  function addDays(iso, n) { return toIso(toDay(iso) + n); }
  function semesterOf(day) {
    var dt = new Date(day * DAY);
    return dt.getUTCFullYear() + '-' + (dt.getUTCMonth() < 6 ? 1 : 2);
  }
  function lastKnown(rates) {
    return Object.keys(rates).sort(function (a, b) { return a < b ? -1 : 1; }).pop();
  }
  // Devuelve {rate, provisional}. Si el semestre aún no está publicado usa el último conocido.
  function rateFor(day, rates) {
    var key = semesterOf(day);
    if (rates[key] != null) return { rate: rates[key], provisional: false, key: key };
    var last = lastKnown(rates);
    if (key > last) return { rate: rates[last], provisional: true, key: key };
    return { rate: NaN, provisional: false, key: key };
  }
  function round2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }

  // "1.850,50" · "1850.5" · "1 850,5 €" -> 1850.5 ; NaN si no es un importe.
  function parseEuro(s) {
    if (typeof s === 'number') return s;
    if (typeof s !== 'string') return NaN;
    var t = s.replace(/[€\s ]/g, '');
    if (!t) return NaN;
    var lc = t.lastIndexOf(','), lp = t.lastIndexOf('.');
    if (lc >= 0 && lp >= 0) {
      if (lc > lp) t = t.replace(/\./g, '').replace(',', '.');   // 1.234,50
      else t = t.replace(/,/g, '');                              // 1,234.50
    } else if (lc >= 0) {
      if (t.indexOf(',') !== lc) return NaN;                     // 1,234,567 es ambiguo
      t = t.replace(',', '.');
    } else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
    if (!/^\d+(\.\d+)?$/.test(t)) return NaN;
    return parseFloat(t);
  }

  function dueDate(inv) {
    var term = inv.term == null || inv.term === '' ? DEFAULT_TERM : +inv.term;
    var eff = Math.min(term, MAX_TERM);
    return { iso: addDays(inv.delivered, eff), term: term, effective: eff, capped: term > MAX_TERM };
  }

  function validate(inv, todayIso) {
    var e = {};
    if (!inv.client || !String(inv.client).trim()) e.client = 'Escribe el nombre del cliente.';
    var amt = parseEuro(inv.amount);
    if (!(amt > 0)) e.amount = 'Escribe el importe total de la factura, con IVA. Ejemplo: 1.850,00';
    else if (amt > 10000000) e.amount = 'El importe máximo es 10.000.000 €.';
    var d = toDay(inv.delivered);
    if (isNaN(d)) e.delivered = 'Elige la fecha de entrega o de la factura.';
    else if (new Date(d * DAY).getUTCFullYear() < FIRST_YEAR) e.delivered = 'Sesenta calcula facturas desde 2015. Las anteriores están casi con seguridad prescritas.';
    else if (todayIso && d > toDay(todayIso) + 366) e.delivered = 'La fecha está a más de un año vista. Revísala.';
    var term = inv.term == null || inv.term === '' ? DEFAULT_TERM : +inv.term;
    if (!(term >= 0 && term <= 365) || Math.floor(term) !== term) e.term = 'El plazo son días enteros, entre 0 y 365.';
    var paid = 0;
    (inv.payments || []).forEach(function (p, i) {
      var pa = parseEuro(p.amount), pd = toDay(p.date);
      if (!(pa > 0)) e['pay' + i] = 'Importe del pago no válido.';
      else if (isNaN(pd)) e['pay' + i] = 'Fecha del pago no válida.';
      else if (!isNaN(d) && pd < d - 366) e['pay' + i] = 'El pago es muy anterior a la entrega. Revisa la fecha.';
      else paid += pa;
    });
    if (amt > 0 && round2(paid) > round2(amt)) e.payments = 'Los pagos suman más que la factura.';
    return e;
  }

  /* Calcula la deuda de una factura a una fecha.
     - El interés corre desde el día siguiente al vencimiento (art. 5), sin necesidad de aviso.
     - Interés simple, base 365, con el tipo de cada semestre.
     - Los pagos parciales reducen el principal (criterio prudente para el acreedor). */
  function compute(inv, asOfIso, rates) {
    rates = rates || RATES;
    var amount = round2(parseEuro(inv.amount));
    var due = dueDate(inv);
    var dueDay = toDay(due.iso), asOf = toDay(asOfIso);
    var pays = (inv.payments || []).map(function (p) {
      return { day: toDay(p.date), amount: round2(parseEuro(p.amount)) };
    }).filter(function (p) { return p.amount > 0 && !isNaN(p.day); })
      .sort(function (a, b) { return a.day - b.day; });

    var res = {
      amount: amount, due: due.iso, term: due.term, effectiveTerm: due.effective, capped: due.capped,
      applies: inv.b2b !== false, segments: [], interest: 0, fixed: 0, daily: 0,
      daysLate: 0, provisional: false, outstanding: amount, paidTotal: 0, status: 'pendiente'
    };
    pays.forEach(function (p) { if (p.day <= asOf) res.paidTotal = round2(res.paidTotal + p.amount); });
    res.outstanding = round2(Math.max(0, amount - res.paidTotal));

    var outAtDue = amount;
    pays.forEach(function (p) { if (p.day <= dueDay) outAtDue = round2(outAtDue - p.amount); });
    var late = asOf > dueDay && outAtDue > 0.004;

    if (asOf <= dueDay) res.status = res.outstanding <= 0.004 ? 'cobrada' : 'en-plazo';
    else if (!late) res.status = 'cobrada';
    else res.status = res.outstanding <= 0.004 ? 'cobrada-tarde' : 'vencida';
    res.daysToDue = dueDay - asOf;

    if (!late || !res.applies) {
      if (late) res.daysLate = asOf - dueDay;
      res.total = res.outstanding;
      return res;
    }

    // Recorre día a día: cada día devenga sobre lo pendiente al empezar ese día.
    var pi = 0, out = amount, seg = null, lastLateDay = dueDay;
    while (pi < pays.length && pays[pi].day <= dueDay) { out = round2(out - pays[pi].amount); pi++; }
    for (var d = dueDay + 1; d <= asOf; d++) {
      while (pi < pays.length && pays[pi].day < d) { out = round2(out - pays[pi].amount); pi++; }
      if (out <= 0.004) break;
      var r = rateFor(d, rates);
      if (isNaN(r.rate)) continue;
      if (r.provisional) res.provisional = true;
      if (!seg || seg.key !== r.key || seg.base !== out) {
        seg = { key: r.key, from: toIso(d), to: toIso(d), days: 0, base: out, rate: r.rate, provisional: r.provisional, interest: 0 };
        res.segments.push(seg);
      }
      seg.days++; seg.to = toIso(d);
      lastLateDay = d;
    }
    var total = 0;
    res.segments.forEach(function (s) {
      s.interest = round2(s.base * s.rate / 100 * s.days / 365);
      total += s.interest;
    });
    res.interest = round2(total);
    res.fixed = FIXED_COST;
    res.daysLate = lastLateDay - dueDay;
    if (res.outstanding > 0.004) res.daily = round2(res.outstanding * rateFor(asOf, rates).rate / 100 / 365);
    res.total = round2(res.outstanding + res.interest + res.fixed);
    return res;
  }

  function summarize(list, asOfIso, rates) {
    var s = { principal: 0, interest: 0, fixed: 0, total: 0, daily: 0, late: 0, count: list.length };
    list.forEach(function (inv) {
      var c = compute(inv, asOfIso, rates);
      if (c.status === 'vencida' || c.status === 'cobrada-tarde') {
        s.principal += c.outstanding; s.interest += c.interest; s.fixed += c.fixed; s.daily += c.daily; s.late++;
      }
    });
    ['principal', 'interest', 'fixed', 'daily'].forEach(function (k) { s[k] = round2(s[k]); });
    s.total = round2(s.principal + s.interest + s.fixed);
    return s;
  }

  // Siguiente paso recomendado según lo ya enviado. Días de espera entre pasos: 7, 10, 30.
  var STEPS = [
    { id: 'recordatorio', label: 'Recordatorio amable', wait: 7 },
    { id: 'formal', label: 'Reclamación formal', wait: 10 },
    { id: 'negociacion', label: 'Propuesta de negociación', wait: 30 }
  ];
  function nextStep(inv, c, asOfIso) {
    if (c.status === 'en-plazo') return { kind: 'en-plazo', step: null, date: c.due };
    if (c.status === 'cobrada') return { kind: 'hecho', step: null, date: null };
    if (!c.applies) return { kind: 'no-aplica', step: null, date: null };
    var log = inv.log || {};
    var asOf = toDay(asOfIso);
    var first = c.status === 'cobrada-tarde' ? 1 : 0;   // ya cobrado: no tiene sentido el recordatorio
    for (var i = STEPS.length - 1; i >= first; i--) {
      var sent = log[STEPS[i].id];
      if (sent) {
        var ready = toDay(sent) + STEPS[i].wait;
        if (i === STEPS.length - 1) {
          return asOf >= ready ? { kind: 'abogado', step: null, date: toIso(ready) } : { kind: 'esperar', step: null, date: toIso(ready) };
        }
        return asOf >= ready ? { kind: 'enviar', step: STEPS[i + 1].id, date: null } : { kind: 'esperar', step: STEPS[i + 1].id, date: toIso(ready) };
      }
    }
    return { kind: 'enviar', step: STEPS[first].id, date: null };
  }

  return {
    RATES: RATES, STEPS: STEPS, MAX_TERM: MAX_TERM, DEFAULT_TERM: DEFAULT_TERM, FIXED_COST: FIXED_COST,
    toDay: toDay, toIso: toIso, addDays: addDays, semesterOf: semesterOf, rateFor: rateFor,
    parseEuro: parseEuro, round2: round2, dueDate: dueDate, validate: validate,
    compute: compute, summarize: summarize, nextStep: nextStep, lastKnown: lastKnown
  };
})();
if (typeof module !== 'undefined') module.exports = Sesenta;
