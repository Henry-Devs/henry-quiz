# Cómo cargar una masterclass

Las masterclasses viven en **`masterclasses.json`**. De ese archivo leen el hub,
`soyhenry.com/masterclasses`, y la página de cada una, `soyhenry.com/masterclasses/<slug>`. El
cambio se ve segundos después del push, sin tocar nada de soyhenry.com.

> **El HTML viejo no se edita.** `masterclasses.html` ya no existe: redirige al hub nuevo. Las
> `landing-*.html` de masterclasses siguen publicadas hasta que terminen sus campañas y después
> redirigen igual. Editarlas no cambia nada en soyhenry.com. Todo va al JSON.

## Sumar una masterclass

1. Subí el banner a la raíz del repo (por ejemplo `banner-mi-masterclass.jpg`), junto con la foto
   del speaker y el logo de la empresa si hay.
2. En `masterclasses.json`, copiá un objeto de la lista `masterclasses` y editalo:

| Campo | Qué va | Ejemplo |
| --- | --- | --- |
| `slug` | La URL de la página: `soyhenry.com/masterclasses/<slug>`. Minúsculas, números y guiones. Único, y no se cambia una vez publicado. | `roadmap-programador-ia` |
| `nombre` | Título de la masterclass. | `El roadmap para convertirte en programador con IA en 2026` |
| `desc` | Una o dos oraciones. | |
| `carrera` | Una de: `AI Engineering`, `AI Automation`, `Full Stack AI`, `Data Science`. | `Full Stack AI` |
| `fecha` | Inicio, en ISO 8601 **con la zona horaria**. Decide sola si la masterclass es "próxima" o "ya pasó". | `2026-09-09T21:00:00-03:00` |
| `duracionMin` | Opcional. Minutos que dura. Si no va, se toma 60. | `45` |
| `fechaCorta` | Tal cual se muestra en la card. | `9 SEP` |
| `fechaLarga` | Tal cual se muestra en la card grande. | `Miércoles 9 de septiembre` |
| `hora` | Tal cual se muestra, con banderas. | `18h MX 🇲🇽 / 19h COL 🇨🇴 / 21h ARG 🇦🇷` |
| `banner` | Archivo del banner del paso 1. | `banner-roadmap.jpg` |
| `speakers` | Lista de `{ "nombre", "rol" }`, más `foto`, `bio` y `logo` si hay. | |
| `link` | La landing vieja de este repo. Queda por compatibilidad; no se crea una nueva. | `landing-roadmap-programador-ia.html` |
| `landing` | La página en soyhenry.com. Ver abajo. | |

3. Antes de pushear, validá el JSON:

   ```bash
   node scripts/validate-masterclasses.mjs
   ```

   Tiene que terminar en `✓`. Si no, lista cada problema con la masterclass y el campo.
   soyhenry.com descarta en silencio lo que no cumple, y un JSON roto deja el hub **sin
   masterclasses**. La misma validación corre en GitHub con cada push que toque el JSON o las
   imágenes.

## La landing de cada masterclass

Una masterclass con el objeto `landing` tiene su propia página en `soyhenry.com/masterclasses/<slug>`.
La página se arma sola a partir de estos datos, así que no hay HTML que escribir.

```jsonc
"landing": {
  "hero": { "badges": ["1 hora"], "kicker": "…", "bajada": "…" },  // todo opcional
  "grabaciones": [{ "url": "https://www.youtube.com/watch?v=…" }],   // el video, apenas exista el link
  "hubspot": { "masterclass_nombre": "…", /* …los campos del form, tal cual */ },
  "bloques": [ /* las secciones de la página, en orden */ ]
}
```

- **La página cambia sola de estado.** Hasta que termina la clase (`fecha` + `duracionMin`)
  muestra el form de registro. Después, el mismo form pasa a dar acceso a la grabación. Nadie
  tiene que editar la landing después de la clase: alcanza con sumar el link del video en
  `grabaciones`.
- **`hubspot`** lleva los campos del form de registro con el valor exacto que se manda a HubSpot.
  Sin `hubspot` no hay form: los botones van directo al video.
- **`bloques`** son las secciones de la página. Los tipos disponibles son `lista`, `tarjetas`,
  `cifras`, `texto`, `faq`, `empresa`, `mapa`, `aviso`, `testimonios`, `ficha`, `chips`, `seccion`
  y `cierre`. Lo más fácil es copiar una masterclass parecida y editar. En los textos se puede
  usar `**negrita**`, `*énfasis*` y `==resaltado==`.
- Los badges de estado ("En vivo y gratis" / "Grabación disponible"), los textos de los botones y
  la línea de fecha del cierre los pone la página según el estado. No van en el JSON.

## Reglas

- **No cambies `landing.hubspot.masterclass_nombre` con la campaña corriendo.** Es la condición de
  entrada del flow de mails del evento en HubSpot y tiene que coincidir exacto. No siempre es
  igual al `nombre` que se muestra (el de open-house es `Open House AI Automation`).
- **El `slug` no se cambia** una vez publicado: es la URL que usan las campañas.
- **Para reemplazar una imagen, subila con un nombre nuevo.** Se cachean una hora.
- El orden de la lista no importa: las páginas ordenan por `fecha`.
- `schemaVersion` no se toca.

## Qué hace el aviso a soyhenry.com

`.github/workflows/revalidate-masterclasses.yml` corre cuando termina un deploy de producción de
este repo y le pide a soyhenry.com que vuelva a leer el JSON. Usa el secret
`MASTERCLASSES_REVALIDATE_SECRET` de GitHub Actions, con el mismo valor que la variable del mismo
nombre en el proyecto `fe-c-landing` de Vercel. Sin el secret no falla: solo avisa que no está
configurado, y el cambio se ve igual con la revalidación de cada hora.
