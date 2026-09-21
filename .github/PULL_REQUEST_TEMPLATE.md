## Qué cambia



---

<!-- Borrá esta sección si el PR no toca masterclasses. -->

### Si el PR suma o cambia una masterclass

- [ ] El cambio está en `masterclasses.json` (no en un HTML: soyhenry.com lee solo el JSON).
- [ ] `node scripts/validate-masterclasses.mjs` termina en `✓`.
- [ ] Las imágenes nuevas están en la raíz y el JSON las nombra.
- [ ] `slug` nuevo y definitivo; `fecha` con zona horaria.
- [ ] Si la campaña está corriendo, `landing.hubspot.masterclass_nombre` quedó igual.

Cómo se carga una masterclass: [MASTERCLASSES.md](../MASTERCLASSES.md).
