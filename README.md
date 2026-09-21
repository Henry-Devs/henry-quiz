# recursos.soyhenry.com

Sitio estático servido por Vercel: landings de descargables, quizzes y **los datos de las
masterclasses**. No tiene build; lo que está en la raíz es lo que se publica.

## Masterclasses → `masterclasses.json`

Las masterclasses se cargan **editando `masterclasses.json`**, no creando HTML. De ese archivo se
arman `soyhenry.com/masterclasses` y la página de cada masterclass. Cómo hacerlo, campo por campo:
**[MASTERCLASSES.md](MASTERCLASSES.md)**.

Antes de pushear:

```bash
node scripts/validate-masterclasses.mjs
```

El HTML viejo de masterclasses (`masterclasses.html` y las `landing-*.html` que el JSON nombra en
`link`) está congelado: editarlo no cambia nada en soyhenry.com.
