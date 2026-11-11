# Sesenta

Lo que te deben por cada factura vencida, con sus intereses.

Sesenta es una herramienta para autónomos y pequeñas empresas en España. Calcula lo que se debe por una factura impagada entre profesionales (principal, intereses de demora de la Ley 3/2004 por semestres y 40 € por factura), redacta tres cartas de reclamación y lleva el seguimiento.

No es asesoramiento jurídico. Los modelos de carta están pendientes de revisión por un abogado.

## Contenido

| Carpeta | Qué hay |
| --- | --- |
| `app/` | La aplicación. `index.html` es un único archivo que funciona abriéndolo en el navegador o en cualquier alojamiento estático. |
| `landing/` | Fuente de la página de inicio, en el formato del lienzo de diseño de Claude (`.dc.html`). No se abre directamente en un navegador. |
| `docs/` | `dossier.md` (mercado, decisión, marca, auditoría, registro de decisiones), `plan-de-lanzamiento.md` (30 días, 10 piezas y mensajes de outreach) y `modelo-de-negocio.md`. |

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
