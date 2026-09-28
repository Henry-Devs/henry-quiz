#!/usr/bin/env node
// Valida guias.json antes de publicarlo.
//
// soyhenry.com/guias lee este archivo y descarta en silencio la guía que no respeta el contrato:
// simplemente no aparece. Este script es el aviso previo: dice qué está mal y dónde.
//
// Las reglas son las del schema de fe-c-landing (src/utils/guides/schema.ts; contrato en
// docs/superpowers/specs/2026-09-28-guias-hub-design.md §3). Si cambian allá, cambian acá.
//
// Uso: node scripts/validate-guias.mjs [archivo.json]
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const file = resolve(process.argv[2] ?? 'guias.json');
const root = dirname(file);

const CARRERAS = ['AI Engineering', 'AI Automation', 'Full Stack AI', 'Data Science', 'Finanzas', 'General'];
const TIPOS = ['pdf', 'externo'];
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const errores = [];
const texto = (v) => typeof v === 'string' && v.trim().length > 0;
const error = (donde, mensaje) => errores.push(`${donde}: ${mensaje}`);
const requerido = (obj, campo, donde) => {
  if (!texto(obj?.[campo])) error(donde, `falta "${campo}" o está vacío`);
};

let data;
try {
  data = JSON.parse(readFileSync(file, 'utf8'));
} catch (e) {
  console.error(`✗ ${file} no es JSON válido: ${e.message}`);
  process.exit(1);
}

if (data.schemaVersion !== 1) error('raíz', '"schemaVersion" tiene que ser 1');
if (!Array.isArray(data.guias) || data.guias.length === 0) error('raíz', '"guias" tiene que ser una lista no vacía');

const slugs = new Set();

(data.guias ?? []).forEach((guia, i) => {
  const donde = `guias[${i}] (${guia?.slug ?? 'sin slug'})`;

  if (!SLUG.test(guia?.slug ?? '')) error(donde, '"slug" tiene que ser minúsculas, números y guiones');
  if (slugs.has(guia?.slug)) error(donde, 'el slug está repetido');
  slugs.add(guia?.slug);

  requerido(guia, 'titulo', donde);
  requerido(guia, 'desc', donde);
  requerido(guia, 'cta', donde);
  if (!CARRERAS.includes(guia?.carrera)) error(donde, `"carrera" tiene que ser una de: ${CARRERAS.join(', ')}`);
  if (guia?.trending !== undefined && typeof guia.trending !== 'boolean') error(donde, '"trending" tiene que ser true o false');
  if (!TIPOS.includes(guia?.tipo)) error(donde, `"tipo" tiene que ser "pdf" o "externo"`);

  if (guia?.tipo === 'pdf') {
    requerido(guia, 'pdf', donde);
    if (texto(guia.pdf) && !existsSync(resolve(root, guia.pdf))) error(donde, `el PDF "${guia.pdf}" no está en el repo`);

    const l = guia.landing;
    if (!l || typeof l !== 'object') {
      error(donde, 'una guía "pdf" necesita "landing"');
    } else {
      ['kicker', 'bajada', 'carreraPath', 'carreraCta', 'contentName'].forEach((c) => requerido(l, c, `${donde}.landing`));
      if (!Array.isArray(l.aprenderas) || l.aprenderas.length === 0 || !l.aprenderas.every(texto)) {
        error(`${donde}.landing`, '"aprenderas" tiene que ser una lista de textos no vacía');
      }
      if (texto(l.carreraPath) && !l.carreraPath.startsWith('/')) error(`${donde}.landing`, '"carreraPath" es una ruta de soyhenry.com y empieza con /');
    }
  }

  if (guia?.tipo === 'externo') {
    requerido(guia, 'url', donde);
    if (texto(guia.url) && !/^https?:\/\//.test(guia.url) && !existsSync(resolve(root, guia.url))) {
      error(donde, `"${guia.url}" no está en el repo ni es una URL absoluta`);
    }
  }
});

if (errores.length) {
  console.error(`✗ ${errores.length} problema(s) en ${file}:`);
  errores.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}

console.log(`✓ ${file}: ${data.guias.length} guías válidas`);
