/*
 * live-estado.js — la landing de un live cambia sola según la hora (owner, 30/10/2026).
 *
 *   antes      → como está escrita: "Reserva tu lugar", te avisamos por mail.
 *   en vivo    → desde 30 min antes hasta que termina: "Entra al vivo" y, al registrarse,
 *                la transmisión se abre AHÍ MISMO (YouTube embebido).
 *   grabación  → cuando terminó: "Mira la grabación" y, al registrarse, se abre la grabación
 *                embebida. No sale ningún mail con la grabación: el flujo de HubSpot deriva a
 *                esa persona al camino "Grabación · se anotó después del live" (sólo nurturing).
 *
 * 🛑 Los cortes (30 min antes / inicio + duración) son LOS MISMOS que usa el flujo
 *    (henry-marketing: scripts/regla_inscriptos_tarde.py). Si cambia uno, cambia el otro.
 * 🛑 El link de YouTube del live ES la grabación (queda publicado en la misma URL).
 *
 * Uso, antes de </body> y DESPUÉS del script del formulario:
 *   <script>
 *     window.HENRY_LIVE = {
 *       clases: [{ inicio: '2026-10-29T20:00:00-03:00', duracion: 45,
 *                  video: 'https://www.youtube.com/watch?v=XXXX', nombre: 'La clase' }],
 *     };
 *   </script>
 *   <script src="live-estado.js"></script>
 *
 * Para probar un estado sin esperar: ?estado=envivo o ?estado=grabacion en la URL.
 */
(function () {
  var C = window.HENRY_LIVE;
  if (!C || !C.clases || !C.clases.length) return;

  var MIN = 60000, ANTES = 30;
  var ahora = Date.now();
  var clases = C.clases.map(function (c) {
    var ini = new Date(c.inicio).getTime();
    return { ini: ini, fin: ini + (c.duracion || 60) * MIN, video: c.video || '', nombre: c.nombre || '' };
  });

  var forzado = new URLSearchParams(location.search).get('estado');
  var actual = clases.filter(function (c) { return ahora >= c.ini - ANTES * MIN && ahora < c.fin; })[0];
  var estado = forzado || (actual ? 'envivo' : (ahora >= clases[clases.length - 1].fin ? 'grabacion' : 'antes'));
  if (estado === 'antes') return;
  if (estado === 'envivo' && !actual) actual = clases[0];

  var T = estado === 'envivo' ? {
    cta: 'Entra al vivo →', titulo: 'Estamos en vivo ahora', badge: '🔴 En vivo ahora',
    sub: 'Es gratis. Completa tus datos y la transmisión se abre aquí mismo.',
    boton: 'Entrar al vivo', listo: '¡Ya estás adentro!',
    texto: 'La clase está en vivo. Si no arranca, toca play.',
    falta: 'La transmisión arranca en unos minutos. Vuelve a esta página a la hora del live.',
  } : {
    cta: 'Mira la grabación →', titulo: 'Mira la grabación completa', badge: 'Grabación disponible',
    sub: 'Es gratis. Completa tus datos y la clase se abre aquí mismo.',
    boton: 'Ver la grabación', listo: '¡Listo! Aquí la tienes',
    texto: clases.length > 1 ? 'Las clases completas, para verlas a tu ritmo.' : 'La clase completa, para verla a tu ritmo.',
    falta: 'La grabación va a estar disponible muy pronto en esta misma página.',
  };
  if (C.textos && C.textos[estado]) for (var k in C.textos[estado]) T[k] = C.textos[estado][k];

  function txt(sel, valor) {
    document.querySelectorAll(sel).forEach(function (el) { el.textContent = valor; });
  }

  // CTAs que bajan al formulario
  txt('a[href="#registro"]', T.cta);
  // Título y bajada del formulario (las dos plantillas de landing)
  txt('#form-wrapper h2, #form-wrapper h3, .reg-title', T.titulo);
  txt('.form-sub', T.sub);
  // Fecha y hora: en grabación ya no aplican
  if (estado === 'grabacion') {
    document.querySelectorAll('.event-compact-facts').forEach(function (el) { el.style.display = 'none'; });
    document.querySelectorAll('.hero-schedule-line, .form-recap-facts').forEach(function (el) {
      el.textContent = 'Grabación completa · disponible ahora · gratis';
    });
  }
  // Badges/chips que dicen "en vivo"
  document.querySelectorAll('.badge, .chip').forEach(function (el) {
    if (/vivo/i.test(el.textContent)) el.textContent = T.badge;
  });

  // Botón del formulario de HubSpot (vive en un iframe que tarda en cargar)
  var intentos = 0;
  (function boton() {
    var f = document.querySelector('#hs-form-container iframe');
    var b = f && f.contentDocument && f.contentDocument.querySelector('input[type="submit"]');
    if (b && b.value !== T.boton) b.value = T.boton;
    if (intentos++ < 40) setTimeout(boton, 250);   // la landing también lo pisa a los 600 ms
  })();

  // Lo que aparece al registrarse: el video embebido en vez de "te avisamos por mail"
  function embed(url) {
    var m = String(url).match(/(?:v=|youtu\.be\/|embed\/|live\/)([\w-]{11})/);
    if (!m) return null;
    var w = document.createElement('div');
    w.style.cssText = 'position:relative;width:100%;padding-top:56.25%;border-radius:12px;overflow:hidden;background:#000;margin-top:14px;';
    w.innerHTML = '<iframe src="https://www.youtube.com/embed/' + m[1] + '?rel=0&autoplay=1" ' +
      'style="position:absolute;inset:0;width:100%;height:100%;border:0;" ' +
      'allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>';
    return w;
  }
  var ok = document.getElementById('success-state');
  if (!ok) return;
  var h = ok.querySelector('h3'); if (h) h.textContent = T.listo;
  ok.querySelectorAll('p, .btn, a.btn').forEach(function (el) { el.style.display = 'none'; });
  var caja = document.createElement('div');
  caja.style.textAlign = 'left';
  var p = document.createElement('p'); p.textContent = T.texto; p.style.display = 'block';
  caja.appendChild(p);
  ok.appendChild(caja);
  ok.style.maxWidth = '100%';
  var lista = estado === 'envivo' ? [actual] : clases;
  if (!lista.some(function (c) { return c.video && embed(c.video); })) p.textContent = T.falta;

  // 🛑 Los iframes se crean recién cuando la landing MUESTRA el estado de éxito (después del
  // submit). Creados de entrada, con autoplay, el video sonaría escondido antes de registrarse.
  var puesto = false;
  function poner() {
    if (puesto || getComputedStyle(ok).display === 'none') return;
    puesto = true;
    lista.forEach(function (c) {
      var e = c.video && embed(c.video);
      if (!e) return;
      if (lista.length > 1 && c.nombre) {
        var t = document.createElement('p');
        t.textContent = c.nombre; t.style.cssText = 'display:block;font-weight:700;margin-top:18px;';
        caja.appendChild(t);
      }
      caja.appendChild(e);
    });
    ok.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  new MutationObserver(poner).observe(ok, { attributes: true, attributeFilter: ['style', 'class'] });
  poner();
})();
