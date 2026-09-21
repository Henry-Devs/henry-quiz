#!/usr/bin/env node
// Recordatorio: si un cambio toca una masterclass, tiene que pasar por masterclasses.json.
//
// El riesgo es que alguien sume o edite una masterclass como se hacía antes —un HTML nuevo, un
// banner suelto— y el cambio no aparezca nunca en soyhenry.com, que lee solo el JSON. Esto no
// bloquea nada: deja el aviso en el PR, con el archivo que lo disparó.
//
// Uso: git diff --name-status <base> <head> | node scripts/check-masterclasses-touched.mjs
import { readFileSync } from 'node:fs';
import { appendFileSync } from 'node:fs';

const JSON_PATH = 'masterclasses.json';
const IMAGEN = /\.(jpg|jpeg|png|webp|svg|gif)$/i;

const entrada = readFileSync(0, 'utf8').trim();
const cambios = entrada
  .split('\n')
  .filter(Boolean)
  .map((linea) => {
    const partes = linea.split('\t');
    const estado = partes[0][0]; // A, M, D, R…
    const ruta = partes[partes.length - 1]; // en renames, el destino
    return { estado, ruta };
  });

const datos = JSON.parse(readFileSync(JSON_PATH, 'utf8'));
const masterclasses = datos.masterclasses ?? [];
const porLink = new Map(masterclasses.filter((m) => m.link).map((m) => [m.link, m]));

const jsonTocado = cambios.some(({ ruta }) => ruta === JSON_PATH);
const avisos = [];

for (const { estado, ruta } of cambios) {
  if (estado === 'D') continue;

  const masterclass = porLink.get(ruta);
  if (masterclass) {
    avisos.push(
      `\`${ruta}\` es la landing vieja de **${masterclass.nombre}**. Esa página ya no es la ` +
        `fuente: soyhenry.com/masterclasses/${masterclass.slug} se arma con \`${JSON_PATH}\`. ` +
        `Llevá el cambio al JSON o se va a perder.`,
    );
    continue;
  }

  if (estado === 'A' && /^landing-.*\.html$/.test(ruta)) {
    avisos.push(
      `\`${ruta}\` es una landing nueva. Si es una masterclass, no se carga así: se suma a ` +
        `\`${JSON_PATH}\` y la página sale sola. Ver MASTERCLASSES.md.`,
    );
    continue;
  }

  if (estado === 'A' && IMAGEN.test(ruta) && !jsonTocado) {
    avisos.push(
      `\`${ruta}\` entró sin cambios en \`${JSON_PATH}\`. Si es el banner o la foto de una ` +
        `masterclass, acordate de sumarla al JSON: si no, no aparece en soyhenry.com.`,
    );
  }
}

const titulo = '## Masterclasses';
const cuerpo = avisos.length
  ? [`${titulo}\n`, ...avisos.map((a) => `- ⚠️ ${a}`), '\nCómo se carga una masterclass: [MASTERCLASSES.md](MASTERCLASSES.md).']
  : [`${titulo}\n`, '- ✓ Nada que recordar: el cambio no toca una masterclass por fuera del JSON.'];

const salida = cuerpo.join('\n');
console.log(salida);

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${salida}\n`);
}
for (const aviso of avisos) {
  console.log(`::warning::${aviso.replace(/`|\*\*/g, '')}`);
}
