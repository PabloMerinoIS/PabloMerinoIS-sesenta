# Modelo de negocio (resumen)

La hoja de cálculo viva, con todas las fórmulas, está en https://claude.ai/artifact/WbBgPPdqxSXC4xbcmzD1Tc (se descarga como .xlsx desde su menú).

## Supuestos

| Supuesto | Pesimista | Base | Optimista |
| --- | --- | --- | --- |
| Precio plan mensual, sin IVA (€/mes) | 12 | 12 | 12 |
| Precio plan anual, sin IVA (€/año) | 79 | 79 | 79 |
| Visitas en el mes 1 (estimación) | 300 | 800 | 1.200 |
| Crecimiento mensual de visitas (estimación) | 5 % | 10 % | 15 % |
| Visitantes que acaban pagando (estimación) | 0,2 % | 0,5 % | 1,2 % |
| Clientes que eligen el plan anual (estimación) | 40 % | 50 % | 60 % |
| Baja mensual en el plan mensual (estimación) | 35 % | 25 % | 15 % |
| Infraestructura (€/mes, estimación) | 30 | 30 | 30 |
| Cuota de autónomos (€/mes, estimación a verificar) | 90 | 90 | 90 |
| Marketing (€/mes) | 0 | 50 | 100 |
| Coste único mes 1: revisión legal (€, estimación) | 400 | 400 | 400 |
| Comisión de Stripe | 1,5 % + 0,25 € | 1,5 % + 0,25 € | 1,5 % + 0,25 € |
| Sueldo objetivo del fundador (€/mes) | 1.500 | 1.500 | 1.500 |

## Resultados del año 1

| Indicador | Pesimista | Base | Optimista |
| --- | --- | --- | --- |
| Valor medio de un cliente nuevo | 50,86 € | 61,92 € | 77,39 € |
| Punto de equilibrio: clientes nuevos al mes | 2,4 | 2,7 | 2,8 |
| Visitas al mes para el punto de equilibrio | 1.180 | 549 | 237 |
| Clientes nuevos al mes para pagar también el sueldo | 31,9 | 27,0 | 22,2 |
| Visitas al mes para pagar también el sueldo | 15.926 | 5.394 | 1.852 |
| Ingresos | 462 € | 4.793 € | 26.360 € |
| Resultado, sin sueldo | −1.389 € | 2.240 € | 22.725 € |
| Clientes de pago captados | 9,6 | 85,5 | 417,6 |
| Primer mes con resultado positivo | Ninguno | 2 | 1 |

## Fórmulas por mes

- Visitas = visitas del mes anterior × (1 + crecimiento)
- Clientes nuevos = visitas × conversión; anuales = nuevos × % anual; mensuales = el resto
- Mensuales activos = activos del mes anterior × (1 − baja) + nuevos mensuales
- Ingresos = nuevos anuales × 79 + mensuales activos × 12
- Comisiones = ingresos × 1,5 % + (nuevos anuales + mensuales activos) × 0,25
- Resultado = ingresos − comisiones − costes fijos. No cuenta renovaciones anuales ni sueldo.
