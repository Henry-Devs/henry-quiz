# henry-quiz

Sitio estático (HTML + assets, sin build) servido por Vercel en `recursos.soyhenry.com`. Aloja
landings de descargables, quizzes y **los datos de las masterclasses**.

## Masterclasses: la única fuente es `masterclasses.json`

`soyhenry.com/masterclasses` (el hub) y `soyhenry.com/masterclasses/<slug>` (la landing de cada
una) se arman leyendo **`masterclasses.json` de este repo**. No hay HTML de masterclasses para
escribir: la página de cada masterclass sale del JSON.

**Para sumar o cambiar una masterclass:**

1. Subí las imágenes nuevas (banner, foto del speaker, logo) a la raíz del repo.
2. Editá `masterclasses.json`. Lo más seguro es copiar una masterclass parecida y cambiar los
   valores. Qué va en cada campo: `MASTERCLASSES.md`.
3. Validá antes de commitear:

   ```bash
   node scripts/validate-masterclasses.mjs
   ```

   Tiene que terminar en `✓`. Si marca problemas, corregilos: soyhenry.com descarta en silencio
   lo que no cumple. La misma validación corre en GitHub con cada push que toque el JSON o las
   imágenes.
4. Commit y push a `main`. Vercel publica recursos.soyhenry.com y soyhenry.com toma el cambio en
   menos de una hora, sin deploy de por medio.

**No hace falta crear una landing HTML nueva ni tocar nada de soyhenry.com.** Una masterclass con
`landing` en el JSON tiene su página sola.

### El HTML viejo de masterclasses está congelado

`masterclasses.html` y las `landing-*.html` que el JSON nombra en `link` son el hub anterior.
Siguen publicadas hasta que el hub nuevo salga a producción, y entonces se borran y redirigen.
**No las edites**: un cambio ahí no llega a soyhenry.com y se pierde cuando se borren. Todo cambio
de contenido de una masterclass va al JSON.

### Reglas

- **`landing.hubspot.masterclass_nombre` no se cambia con la campaña corriendo.** Es la condición
  de entrada del flow de mails del evento en HubSpot y tiene que coincidir exacto. No siempre es
  igual a `nombre`.
- **El `slug` es la URL (`/masterclasses/<slug>`) y no se cambia** una vez publicado: rompería los
  links de las campañas.
- **`fecha` va con zona horaria** (`2026-09-24T19:00:00-03:00`). Decide sola si la masterclass es
  próxima o pasada: la landing pasa del form de registro al acceso a la grabación sin que nadie la
  toque.
- **Para cambiar una imagen, subila con un nombre nuevo** y actualizá el JSON. Las imágenes se
  cachean una hora: si reemplazás un archivo con el mismo nombre, el cambio puede tardar en verse.
- `schemaVersion` no se toca.
- El contrato completo (tipos de bloque, campos, estados) está en fe-c-landing:
  `docs/superpowers/specs/2026-09-18-migracion-masterclasses-a-soyhenry-design.md` (§4 y §8). Si
  cambia allá, se actualiza `scripts/validate-masterclasses.mjs`.

## Cómo verificar sin romper nada

- **No hagas polling ni loops contra `recursos.soyhenry.com`** (ni `curl` en un `while`, ni un
  navegador automatizado recargando). El sitio está detrás de la protección anti-DDoS automática
  de Vercel: el 18/9/2026 un par de loops de espera la dispararon y el host empezó a responder 403
  a todo cliente que no es un navegador, incluido soyhenry.com, que lee de acá el JSON y las
  imágenes.
- Para saber si un deploy terminó, preguntale a Vercel o a GitHub, no al sitio:
  `vercel-henry ls henry-quiz --scope soyhenry-team`, o los deployments del commit en la API de
  GitHub.
- Para chequear producción, alcanza con **un** request.
