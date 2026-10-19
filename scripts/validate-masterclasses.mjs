#!/usr/bin/env node
// Valida masterclasses.json antes de publicarlo.
//
// soyhenry.com lee este archivo y descarta en silencio lo que no respeta el contrato: una
// masterclass mal cargada simplemente no aparece, y un bloque roto desaparece de su landing.
// Este script es el aviso previo: dice qué está mal y dónde, antes de que llegue a producción.
//
// Las reglas son las del schema de fe-c-landing (src/utils/masterclasses/schema.ts y
// landing.ts; contrato completo en docs/superpowers/specs/2026-09-18-migracion-masterclasses-
// a-soyhenry-design.md, §4 y §8). Si el contrato cambia allá, se cambia acá también.
//
// Uso:
//   node scripts/validate-masterclasses.mjs                  valida masterclasses.json
//   node scripts/validate-masterclasses.mjs otro.json        valida otro archivo
//   node scripts/validate-masterclasses.mjs --now=2026-10-01T00:00:00-03:00
//                                                             fija "ahora" (para probar estados)
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const args = process.argv.slice(2);
const nowArg = args.find((a) => a.startsWith('--now='));
const file = resolve(args.find((a) => !a.startsWith('--')) ?? 'masterclasses.json');
const root = dirname(file);
const now = nowArg ? new Date(nowArg.slice('--now='.length)) : new Date();

const CARRERAS = ['AI Engineering', 'AI Automation', 'Full Stack AI', 'Data Science'];
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const OFFSET = /(Z|[+-]\d{2}:\d{2})$/;
const YOUTUBE = /(?:youtube\.com\/watch\?|youtu\.be\/)/i;
const ESTILOS = ['numerada', 'viñetas', 'checks', 'tarjetas'];

const errores = [];
const avisos = [];

const texto = (v) => typeof v === 'string' && v.trim().length > 0;
const esHttp = (v) => {
  if (!texto(v)) return false;
  try {
    return ['http:', 'https:'].includes(new URL(v).protocol);
  } catch {
    return false;
  }
};

function error(donde, mensaje) {
  errores.push(`${donde}: ${mensaje}`);
}

function requerido(obj, campo, donde) {
  if (!texto(obj?.[campo])) error(donde, `falta "${campo}" o está vacío`);
}

function opcionalTexto(obj, campo, donde) {
  if (obj?.[campo] !== undefined && !texto(obj[campo])) error(donde, `"${campo}" tiene que ser texto no vacío`);
}

function listaNoVacia(obj, campo, donde) {
  if (!Array.isArray(obj?.[campo]) || obj[campo].length === 0) {
    error(donde, `"${campo}" tiene que ser una lista con al menos un elemento`);
    return false;
  }
  return true;
}

function archivo(ruta, donde, campo) {
  if (!texto(ruta)) return;
  if (!existsSync(resolve(root, ruta))) error(donde, `"${campo}" apunta a "${ruta}", que no está en el repo`);
}

function url(obj, donde) {
  if (!esHttp(obj?.url)) error(donde, `"url" tiene que ser un link http(s) válido (vino "${obj?.url}")`);
}

function bloque(b, donde) {
  const tipo = b?.tipo;
  const aqui = `${donde} (${tipo ?? 'sin tipo'})`;

  switch (tipo) {
    case 'lista':
      opcionalTexto(b, 'titulo', aqui);
      if (!ESTILOS.includes(b.estilo)) error(aqui, `"estilo" tiene que ser uno de: ${ESTILOS.join(', ')}`);
      if (listaNoVacia(b, 'items', aqui)) {
        b.items.forEach((it, i) => {
          if (texto(it)) return;
          if (!texto(it?.titulo)) error(`${aqui} item ${i + 1}`, 'cada item es texto o { titulo, texto? }');
          else opcionalTexto(it, 'texto', `${aqui} item ${i + 1}`);
        });
      }
      opcionalTexto(b, 'nota', aqui);
      if (b.cta !== undefined && b.cta !== true) error(aqui, '"cta" solo puede ser true');
      break;
    case 'tarjetas':
      opcionalTexto(b, 'titulo', aqui);
      if (listaNoVacia(b, 'items', aqui)) {
        b.items.forEach((it, i) => {
          ['etiqueta', 'titulo', 'texto'].forEach((c) => opcionalTexto(it, c, `${aqui} item ${i + 1}`));
          (it.filas ?? []).forEach((f, j) => {
            requerido(f, 'label', `${aqui} item ${i + 1} fila ${j + 1}`);
            requerido(f, 'valor', `${aqui} item ${i + 1} fila ${j + 1}`);
          });
        });
      }
      break;
    case 'cifras':
      ['titulo', 'bajada', 'remate', 'fuente'].forEach((c) => {
        if (c === 'fuente' && typeof b.fuente === 'object') return;
        opcionalTexto(b, c, aqui);
      });
      if (listaNoVacia(b, 'items', aqui)) {
        b.items.forEach((it, i) => {
          requerido(it, 'valor', `${aqui} item ${i + 1}`);
          requerido(it, 'texto', `${aqui} item ${i + 1}`);
          if (it.fuente !== undefined) {
            requerido(it.fuente, 'texto', `${aqui} item ${i + 1} fuente`);
            url(it.fuente, `${aqui} item ${i + 1} fuente`);
          }
        });
      }
      break;
    case 'texto':
      opcionalTexto(b, 'titulo', aqui);
      if (listaNoVacia(b, 'contenido', aqui)) {
        b.contenido.forEach((c, i) => {
          if (!texto(c?.p) && !texto(c?.cita)) error(`${aqui} párrafo ${i + 1}`, 'cada elemento es { p } o { cita }');
        });
      }
      break;
    case 'faq':
      opcionalTexto(b, 'titulo', aqui);
      if (listaNoVacia(b, 'items', aqui)) {
        b.items.forEach((it, i) => {
          requerido(it, 'pregunta', `${aqui} item ${i + 1}`);
          requerido(it, 'respuesta', `${aqui} item ${i + 1}`);
        });
      }
      break;
    case 'empresa':
      requerido(b, 'logo', aqui);
      archivo(b.logo, aqui, 'logo');
      requerido(b, 'texto', aqui);
      if (b.link !== undefined) {
        requerido(b.link, 'texto', `${aqui} link`);
        url(b.link, `${aqui} link`);
      }
      break;
    case 'mapa':
      opcionalTexto(b, 'titulo', aqui);
      opcionalTexto(b, 'bajada', aqui);
      if (listaNoVacia(b, 'pasos', aqui)) b.pasos.forEach((p, i) => texto(p) || error(`${aqui} paso ${i + 1}`, 'vacío'));
      if (b.destacados !== undefined && !(Number.isInteger(b.destacados) && b.destacados > 0)) {
        error(aqui, '"destacados" tiene que ser un entero mayor a 0');
      }
      break;
    case 'aviso':
      requerido(b, 'texto', aqui);
      break;
    case 'testimonios':
      opcionalTexto(b, 'titulo', aqui);
      if (listaNoVacia(b, 'items', aqui)) {
        b.items.forEach((it, i) => ['texto', 'nombre', 'rol'].forEach((c) => requerido(it, c, `${aqui} item ${i + 1}`)));
      }
      break;
    case 'ficha':
      opcionalTexto(b, 'titulo', aqui);
      if (listaNoVacia(b, 'filas', aqui)) {
        b.filas.forEach((f, i) => {
          requerido(f, 'label', `${aqui} fila ${i + 1}`);
          requerido(f, 'valor', `${aqui} fila ${i + 1}`);
        });
      }
      break;
    case 'chips':
      opcionalTexto(b, 'titulo', aqui);
      if (listaNoVacia(b, 'items', aqui)) b.items.forEach((c, i) => texto(c) || error(`${aqui} chip ${i + 1}`, 'vacío'));
      break;
    case 'cierre':
      requerido(b, 'titulo', aqui);
      break;
    case 'seccion':
      ['etiqueta', 'titulo', 'bajada'].forEach((c) => opcionalTexto(b, c, aqui));
      if (b.cta !== undefined && b.cta !== true) error(aqui, '"cta" solo puede ser true');
      if (listaNoVacia(b, 'bloques', aqui)) b.bloques.forEach((h, i) => bloque(h, `${aqui} › bloque ${i + 1}`));
      break;
    default:
      error(aqui, `tipo de bloque desconocido. Los válidos son: lista, tarjetas, cifras, texto, faq, empresa, mapa, aviso, testimonios, ficha, chips, cierre, seccion`);
  }
}

function landing(l, m, donde) {
  if (typeof l !== 'object' || l === null) return error(donde, '"landing" tiene que ser un objeto');

  if (l.hero !== undefined) {
    if (l.hero.badges !== undefined && !(Array.isArray(l.hero.badges) && l.hero.badges.every(texto))) {
      error(`${donde} hero`, '"badges" tiene que ser una lista de textos');
    }
    opcionalTexto(l.hero, 'kicker', `${donde} hero`);
    opcionalTexto(l.hero, 'bajada', `${donde} hero`);
  }

  if (l.grabaciones !== undefined && listaNoVacia(l, 'grabaciones', donde)) {
    l.grabaciones.forEach((g, i) => {
      opcionalTexto(g, 'titulo', `${donde} grabación ${i + 1}`);
      if (!esHttp(g?.url) || !YOUTUBE.test(g.url)) {
        error(`${donde} grabación ${i + 1}`, `"url" tiene que ser un link de YouTube (youtube.com/watch?v=… o youtu.be/…); vino "${g?.url}"`);
      }
    });
  }

  if (l.hubspot !== undefined) {
    requerido(l.hubspot, 'masterclass_nombre', `${donde} hubspot`);
    for (const [k, v] of Object.entries(l.hubspot)) {
      if (typeof v !== 'string') error(`${donde} hubspot`, `"${k}" tiene que ser texto`);
    }
  }

  opcionalTexto(l, 'pixelContentName', donde);

  if (listaNoVacia(l, 'bloques', donde)) l.bloques.forEach((b, i) => bloque(b, `${donde} bloque ${i + 1}`));

  const fin = Date.parse(m.fecha) + (m.duracionMin ?? 60) * 60_000;
  if (now.getTime() < fin && !l.hubspot) {
    error(donde, 'la masterclass todavía no terminó y la landing no trae "hubspot": sin form no hay forma de registrarse');
  }
  if (now.getTime() >= fin && !l.grabaciones) {
    avisos.push(`${donde}: la clase ya pasó y no hay "grabaciones"; la landing va a decir "La grabación va a estar disponible pronto."`);
  }
}

let data;
try {
  data = JSON.parse(readFileSync(file, 'utf8'));
} catch (e) {
  console.error(`✗ ${file} no es JSON válido: ${e.message}`);
  console.error('  Con el JSON roto, soyhenry.com/masterclasses se queda sin masterclasses.');
  process.exit(1);
}

if (data?.schemaVersion !== 1) error('raíz', '"schemaVersion" tiene que ser 1 (no se cambia a mano)');
if (!Array.isArray(data?.masterclasses)) error('raíz', '"masterclasses" tiene que ser una lista');

const slugs = new Set();
for (const [i, m] of (data?.masterclasses ?? []).entries()) {
  const donde = `masterclass ${i + 1}${texto(m?.slug) ? ` (${m.slug})` : ''}`;

  if (!texto(m?.slug) || !SLUG.test(m.slug)) error(donde, '"slug" tiene que ser minúsculas, números y guiones (ej. roadmap-programador-ia)');
  else if (slugs.has(m.slug)) error(donde, `el slug "${m.slug}" está repetido`);
  else slugs.add(m.slug);

  ['nombre', 'desc', 'fechaCorta', 'fechaLarga', 'hora', 'banner', 'link'].forEach((c) => requerido(m, c, donde));
  if (!CARRERAS.includes(m?.carrera)) error(donde, `"carrera" tiene que ser una de: ${CARRERAS.join(', ')}`);

  if (!texto(m?.fecha) || !OFFSET.test(m.fecha) || Number.isNaN(Date.parse(m.fecha))) {
    error(donde, `"fecha" tiene que ser ISO con zona horaria, ej. 2026-09-24T19:00:00-03:00 (vino "${m?.fecha}")`);
  }
  if (m?.duracionMin !== undefined && !(Number.isInteger(m.duracionMin) && m.duracionMin > 0)) {
    error(donde, '"duracionMin" tiene que ser un entero mayor a 0');
  }

  archivo(m?.banner, donde, 'banner');
  if (!m?.landing) archivo(m?.link, donde, 'link');

  if (listaNoVacia(m, 'speakers', donde)) {
    m.speakers.forEach((s, j) => {
      const aqui = `${donde} speaker ${j + 1}`;
      requerido(s, 'nombre', aqui);
      requerido(s, 'rol', aqui);
      opcionalTexto(s, 'foto', aqui);
      opcionalTexto(s, 'logo', aqui);
      archivo(s?.foto, aqui, 'foto');
      archivo(s?.logo, aqui, 'logo');
      if (s?.bio !== undefined && !(Array.isArray(s.bio) && s.bio.every(texto))) error(aqui, '"bio" tiene que ser una lista de textos');
    });
  }

  if (m?.landing !== undefined) landing(m.landing, m, `${donde} landing`);
}

avisos.forEach((a) => console.warn(`! ${a}`));

if (errores.length > 0) {
  console.error(`✗ ${errores.length} ${errores.length === 1 ? 'problema' : 'problemas'} en ${file}:`);
  errores.forEach((e) => console.error(`  - ${e}`));
  console.error('  soyhenry.com descarta lo que no cumple: esas masterclasses o bloques no se verían.');
  process.exit(1);
}

const total = data.masterclasses.length;
const conLanding = data.masterclasses.filter((m) => m.landing).length;
console.log(`✓ ${total} masterclasses válidas (${conLanding} con landing en soyhenry.com)`);
