# Sesenta

Lo que te deben por cada factura vencida, con sus intereses.

Sesenta es una herramienta para autónomos y pequeñas empresas en España. Calcula lo que se debe por una factura impagada entre profesionales (principal, intereses de demora de la Ley 3/2004 por semestres y 40 € por factura), redacta tres cartas de reclamación y lleva el seguimiento.

No es asesoramiento jurídico. Los modelos de carta están pendientes de revisión por un abogado.

## Contenido

| Carpeta | Qué hay |
| --- | --- |
| `app/` | La aplicación. `index.html` es un único archivo que funciona abriéndolo en el navegador o en cualquier alojamiento estático. |
| `landing/` | Fuente de la página de inicio, en el formato del lienzo de diseño de Claude (`.dc.html`). No se abre directamente en un navegador. |
| `docs/` | `dossier.md` (mercado, decisión, marca, auditoría, registro de decisiones), `plan-de-lanzamiento.md` (30 días, 10 piezas y mensajes de outreach), `modelo-de-negocio.xlsx` (hoja de cálculo con fórmulas) y `modelo-de-negocio.md` (su resumen). |

## Modelo de negocio

[`docs/modelo-de-negocio.xlsx`](docs/modelo-de-negocio.xlsx) es la hoja de cálculo completa: 465 fórmulas, sin cifras derivadas escritas a mano.

- **Supuestos**: precios, tráfico, conversión, bajas y costes para los escenarios pesimista, base y optimista, cada uno con su justificación. Las celdas en azul sobre amarillo son las editables.
- **Pesimista**, **Base** y **Optimista**: proyección mes a mes del primer año.
- **Resumen**: punto de equilibrio, ingresos y resultado de cada escenario.

Tráfico y conversión son estimaciones sin dato propio. Hay que sustituirlas por cifras medidas en cuanto existan.

## Usar la app

Abre `app/index.html`. Los datos se guardan solo en el navegador (localStorage).

## Desarrollo

```
cd app
node test.js          # 64 pruebas del motor de cálculo
python3 build.py      # regenera index.html desde app.src.html + engine.js
python3 prueba_flujo.py   # recorrido completo en navegador (requiere Playwright y Chrome)
```

- `engine.js`: motor de cálculo, funciones puras sin DOM. La tabla `RATES` contiene el tipo legal de interés de demora por semestre desde 2015; hay que añadir el nuevo cada enero y cada julio cuando lo publique el BOE.
- `app.src.html`: interfaz. `build.py` inserta el motor en el marcador `/*ENGINE*/`.

## Estado

Versión de lanzamiento sin servidor: no hay cuentas, cobro ni analítica. Ver `docs/` para lo que falta y por qué.
