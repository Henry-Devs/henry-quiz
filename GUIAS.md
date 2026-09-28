# Cómo cargar una guía

Las guías viven en **`guias.json`**. De ese archivo leen el hub, `soyhenry.com/guias`, y la
página de cada una, `soyhenry.com/guias/<slug>`. El cambio se ve segundos después del push, sin
tocar nada de soyhenry.com.

> **El HTML viejo no se edita.** `guias.html` y las `landing-*.html` de guías siguen publicadas
> hasta que se activen los redirects al hub nuevo (ver la tarea de redirects). Hasta entonces
> conviven con `guias.json`, pero editarlas no cambia nada en soyhenry.com: todo lo que ve
> soyhenry.com sale del JSON.

## Sumar una guía

1. Subí el PDF a la raíz del repo (por ejemplo `mi-guia.pdf`).
2. En `guias.json`, copiá un objeto de la lista `guias` y editalo:

| Campo | Qué va | Ejemplo |
| --- | --- | --- |
| `slug` | La URL de la página: `soyhenry.com/guias/<slug>`. Minúsculas, números y guiones. Único, y no se cambia una vez publicado. | `claudecode-cheatsheet` |
| `titulo` | Título de la guía, tal como aparece en la card. | `El cheat sheet definitivo de Claude Code para programadores` |
| `desc` | Una o dos oraciones, la de la card. | |
| `carrera` | Una de: `AI Engineering`, `AI Automation`, `Full Stack AI`, `Data Science`, `Finanzas`, `General`. | `Full Stack AI` |
| `trending` | Opcional. `true` para que aparezca en el filtro "Trending" del hub. Si no va, se toma `false`. | `true` |
| `tipo` | `pdf` o `externo`. Decide qué campos siguen. | `pdf` |
| `pdf` | Sólo si `tipo` es `pdf`. El archivo del paso 1. | `FSAI_IG_CheatSheet.pdf` |
| `url` | Sólo si `tipo` es `externo`. Un HTML de este repo o una URL absoluta. | `reporte-futuro-del-trabajo.html` |
| `cta` | El texto del botón de la card: `"Descargar guía"` para `pdf`, `"Ver reporte"` para `externo`. | `Descargar guía` |
| `landing` | Sólo para `tipo: "pdf"`. La página de la guía en soyhenry.com. Ver abajo. | |

3. Antes de pushear, validá el JSON:

   ```bash
   node scripts/validate-guias.mjs
   ```

   Tiene que terminar en `✓`. Si no, lista cada problema con la guía y el campo. soyhenry.com
   descarta en silencio la guía que no cumple: no aparece en el hub. La misma validación corre en
   GitHub con cada push que toque el JSON o un PDF.

## La landing de cada guía

Toda guía `pdf` tiene su propia página en `soyhenry.com/guias/<slug>` con formulario de descarga.
La página se arma sola a partir de `landing`, así que no hay HTML que escribir.

```jsonc
"landing": {
  "kicker": "Guía gratuita",
  "bajada": "…",                          // debajo del título
  "aprenderas": ["…", "…"],                // la lista de "¿Qué vas a aprender?"
  "carreraPath": "/webfullstack",          // ruta de soyhenry.com; siempre empieza con /
  "carreraCta": "Aplicar a la Carrera Full Stack AI",
  "contentName": "cheatsheet-claudecode"   // content_name que se manda a Meta Pixel al descargar
}
```

Una guía `externo` no lleva `landing`: la card enlaza directo a `url`.

## Reglas

- **El `slug` no se cambia** una vez publicado: es la URL que usan las campañas.
- **`carrera` tiene que ser una de las seis** que acepta el validador. No se inventan nuevas sin
  actualizar `scripts/validate-guias.mjs` y el schema de fe-c-landing.
- **`tipo` decide el contrato**: `pdf` necesita `pdf` y `landing` completos; `externo` necesita
  `url`.
- **Para reemplazar un PDF, subilo con un nombre nuevo.** Se cachea una hora.
- El orden de la lista no importa: el hub ordena las cards como venga el JSON.
- `schemaVersion` no se toca.
- Los textos van en español neutro (sin voseo): "Descarga", no "Descargá".

## Qué hace el aviso a soyhenry.com

`.github/workflows/revalidate-guias.yml` corre cuando termina un deploy de producción de este
repo y le pide a soyhenry.com que vuelva a leer el JSON. Usa el secret
`GUIDES_REVALIDATE_SECRET` de GitHub Actions, con el mismo valor que la variable del mismo nombre
en el proyecto `fe-c-landing` de Vercel. Sin el secret no falla: solo avisa que no está
configurado, y el cambio se ve igual con la revalidación de cada hora.
