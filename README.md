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

El hub viejo (`masterclasses.html`) ya no existe: redirige a `soyhenry.com/masterclasses`, y cada
`landing-*.html` de masterclass redirige a su página nueva. La de AI Engineering 101 sigue
publicada hasta que termine su campaña. Editarlas no cambia nada en soyhenry.com.
