const S = require('./engine.js');
let pass = 0, fail = 0;
function eq(name, got, want, tol) {
  const ok = typeof want === 'number' ? Math.abs(got - want) <= (tol || 0.0101) : JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass++; else { fail++; console.log('FALLA', name, 'obtenido', got, 'esperado', want); }
}
// Fechas
eq('toDay inválida', isNaN(S.toDay('2026-02-30')), true);
eq('addDays cruza año', S.addDays('2025-12-15', 30), '2026-01-14');
eq('bisiesto', S.addDays('2024-02-28', 2), '2024-03-01');
eq('semestre jun', S.semesterOf(S.toDay('2026-06-30')), '2026-1');
eq('semestre jul', S.semesterOf(S.toDay('2026-07-01')), '2026-2');
// Importes
eq('euro es', S.parseEuro('1.850,50'), 1850.5);
eq('euro punto decimal', S.parseEuro('1850.5'), 1850.5);
eq('euro miles sin decimales', S.parseEuro('3.200'), 3200);
eq('euro símbolo', S.parseEuro('1 200,00 €'), 1200);
eq('euro basura', isNaN(S.parseEuro('abc')), true);
eq('euro negativo', isNaN(S.parseEuro('-5')), true);
// Vencimiento
eq('plazo por defecto 30', S.dueDate({ delivered: '2026-07-01' }).iso, '2026-07-31');
eq('plazo 90 se limita a 60', S.dueDate({ delivered: '2026-07-01', term: 90 }).iso, '2026-08-30');
eq('capped', S.dueDate({ delivered: '2026-07-01', term: 90 }).capped, true);
// Caso simple en un semestre: 3.000 €, vence 31-jul-2026, a 11-nov-2026 = 103 días al 10,40 %
let c = S.compute({ amount: '3000', delivered: '2026-07-01', term: 30 }, '2026-11-11');
eq('días de retraso', c.daysLate, 103);
eq('interés simple', c.interest, 3000 * 0.104 * 103 / 365);
eq('40 €', c.fixed, 40);
eq('total', c.total, 3000 + 88.04 + 40);
eq('diario', c.daily, 0.85);
eq('estado', c.status, 'vencida');
// Cruza semestres: vence 15-jun-2026; 16-30 jun = 15 días al 10,15; 1-jul a 11-nov = 134 días al 10,40
c = S.compute({ amount: '1000', delivered: '2026-05-16', term: 30 }, '2026-11-11');
eq('vencimiento', c.due, '2026-06-15');
eq('2 tramos', c.segments.length, 2);
eq('tramo 1 días', c.segments[0].days, 15);
eq('tramo 2 días', c.segments[1].days, 134);
eq('interés 2 semestres', c.interest, 1000 * 0.1015 * 15 / 365 + 1000 * 0.104 * 134 / 365);
// Cruza cambio grande de tipo 2022->2023 (8,00 -> 10,50)
c = S.compute({ amount: '10000', delivered: '2022-11-01', term: 30 }, '2023-01-31');
eq('dic 2022 30 días + ene 31 días', c.interest, 10000 * 0.08 * 30 / 365 + 10000 * 0.105 * 31 / 365);
// En plazo
c = S.compute({ amount: '500', delivered: '2026-11-01', term: 30 }, '2026-11-11');
eq('en plazo', c.status, 'en-plazo'); eq('sin interés', c.interest, 0); eq('sin 40', c.fixed, 0);
// El día del vencimiento no hay mora; el siguiente sí
c = S.compute({ amount: '500', delivered: '2026-10-12', term: 30 }, '2026-11-11');
eq('día de vencimiento', c.status, 'en-plazo');
c = S.compute({ amount: '500', delivered: '2026-10-11', term: 30 }, '2026-11-11');
eq('un día tarde', c.daysLate, 1); eq('40 desde el día 1', c.fixed, 40);
// Pago parcial tras vencer: 2.000 €, vence 31-jul; paga 1.000 el 30-sep. 61 días sobre 2.000 + 42 sobre 1.000
c = S.compute({ amount: '2000', delivered: '2026-07-01', term: 30, payments: [{ date: '2026-09-30', amount: '1000' }] }, '2026-11-11');
eq('parcial pendiente', c.outstanding, 1000);
eq('parcial interés', c.interest, 2000 * 0.104 * 61 / 365 + 1000 * 0.104 * 42 / 365);
eq('parcial tramos', c.segments.length, 2);
// Pago total tarde: sigue debiendo interés y 40 €
c = S.compute({ amount: '2000', delivered: '2026-07-01', term: 30, payments: [{ date: '2026-08-30', amount: '2000' }] }, '2026-11-11');
eq('cobrada tarde', c.status, 'cobrada-tarde');
eq('interés hasta el pago', c.interest, 2000 * 0.104 * 30 / 365);
eq('total = interés + 40', c.total, c.interest + 40);
eq('ya no crece', c.daily, 0);
// Pago total antes de vencer
c = S.compute({ amount: '2000', delivered: '2026-07-01', term: 30, payments: [{ date: '2026-07-20', amount: '2000' }] }, '2026-11-11');
eq('cobrada en plazo', c.status, 'cobrada'); eq('nada que reclamar', c.total, 0);
// Anticipo antes de vencer reduce la base
c = S.compute({ amount: '2000', delivered: '2026-07-01', term: 30, payments: [{ date: '2026-07-10', amount: '500' }] }, '2026-11-11');
eq('base tras anticipo', c.segments[0].base, 1500);
// Semestre futuro sin publicar: usa el último y marca provisional
c = S.compute({ amount: '1000', delivered: '2026-11-01', term: 30 }, '2027-02-01');
eq('provisional', c.provisional, true);
eq('usa 10,40', c.segments[c.segments.length - 1].rate, 10.4);
// Tipo añadido por el usuario
c = S.compute({ amount: '1000', delivered: '2026-11-01', term: 30 }, '2027-02-01', Object.assign({}, S.RATES, { '2027-1': 10.0 }));
eq('ya no provisional', c.provisional, false);
// Cliente particular: la ley no aplica
c = S.compute({ amount: '1000', delivered: '2026-07-01', term: 30, b2b: false }, '2026-11-11');
eq('consumidor sin interés', c.interest, 0); eq('consumidor total', c.total, 1000);
// Validación
let e = S.validate({ client: '', amount: 'x', delivered: 'nope', term: 30 }, '2026-11-11');
eq('3 errores', Object.keys(e).sort(), ['amount', 'client', 'delivered']);
e = S.validate({ client: 'A', amount: '100', delivered: '2026-07-01', term: 30, payments: [{ date: '2026-08-01', amount: '150' }] }, '2026-11-11');
eq('pagos de más', !!e.payments, true);
e = S.validate({ client: 'A', amount: '100', delivered: '2012-07-01', term: 30 }, '2026-11-11');
eq('anterior a 2015', !!e.delivered, true);
e = S.validate({ client: 'A', amount: '100', delivered: '2026-07-01', term: 2.5 }, '2026-11-11');
eq('plazo decimal', !!e.term, true);
e = S.validate({ client: 'A', amount: '1.850,00', delivered: '2026-07-01', term: '' }, '2026-11-11');
eq('válida', Object.keys(e).length, 0);
// Resumen y siguiente paso
const list = [
  { client: 'A', amount: '3000', delivered: '2026-07-01', term: 30 },
  { client: 'B', amount: '500', delivered: '2026-11-01', term: 30 }
];
let s = S.summarize(list, '2026-11-11');
eq('resumen solo vencidas', s.principal, 3000); eq('resumen total', s.total, 3128.04); eq('resumen vencidas', s.late, 1);
let inv = { amount: '3000', delivered: '2026-07-01', term: 30, log: {} };
c = S.compute(inv, '2026-11-11');
eq('euro inglés', S.parseEuro('1,234.50'), 1234.5);
eq('euro ambiguo', isNaN(S.parseEuro('1,234,567')), true);
eq('suma de tramos = total', (function(){var c=S.compute({amount:'1234.5',delivered:'2026-05-01',term:30,payments:[{date:'2026-08-15',amount:'500'},{date:'2026-10-01',amount:'300'}]},'2026-11-11');return S.round2(c.segments.reduce(function(a,x){return a+x.interest},0))===c.interest})(), true);
eq('paso 1', S.nextStep(inv, c, '2026-11-11').step, 'recordatorio');
inv.log.recordatorio = '2026-11-08';
eq('espera', S.nextStep(inv, c, '2026-11-11').kind, 'esperar');
inv.log.recordatorio = '2026-11-01';
eq('paso 2', S.nextStep(inv, c, '2026-11-11').step, 'formal');
inv.log.formal = '2026-10-01'; inv.log.negociacion = '2026-10-05';
eq('tras 30 días', S.nextStep(inv, c, '2026-11-11').kind, 'abogado');
// Larga duración: 4 años, no debe fallar ni dar NaN
c = S.compute({ amount: '1000', delivered: '2022-01-01', term: 30 }, '2026-11-11');
eq('larga sin NaN', isNaN(c.interest), false); eq('larga tramos', c.segments.length, 10);
console.log(pass + ' pruebas correctas, ' + fail + ' fallos');
process.exit(fail ? 1 : 0);

