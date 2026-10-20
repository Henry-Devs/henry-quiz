# Imágenes de los mails

Las imágenes de los mails de Henry (logos, banners) viven acá. Un archivo `mail/<nombre>` se publica
en `https://recursos.soyhenry.com/mail/<nombre>`, y esa es la dirección que va en el mail.

Reemplaza al administrador de archivos de Mailchimp: el mail se pasa de Mailchimp a SendGrid y
SendGrid no guarda imágenes. Los mails del motor (repo `henry-marketing`) sólo aceptan imágenes de
`recursos.soyhenry.com`.

## Para sumar una imagen

1. Subila acá (desde GitHub: *Add file → Upload files*, dentro de esta carpeta).
2. Usá un nombre en minúsculas, sin espacios ni tildes (`banner-halloween-25off.png`).
3. Esperá a que Vercel publique (un par de minutos) y copiá la dirección
   `https://recursos.soyhenry.com/mail/<nombre>` al mail.

**No borres ni reemplaces una imagen que ya está.** Los mails que ya se mandaron la siguen pidiendo:
si cambia o desaparece, esos mails muestran otra cosa o un hueco. Para una versión nueva, subila con
otro nombre.

`header-henry.png` es el header con el logo que llevan casi todos los mails. Las demás conservan el
nombre que tenían en Mailchimp, para poder rastrear cuál reemplaza a cuál.
