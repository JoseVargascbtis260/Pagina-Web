// Service worker - IA CBTIS 260
// Cambia el número de versión cada vez que actualices la página
const VERSION = "v1";
const CACHE = "ia-cbtis260-" + VERSION;

const ARCHIVOS = [
  "./",
  "index.html",
  "que-es.html",
  "antecedentes.html",
  "tipos.html",
  "como-funciona.html",
  "generativa.html",
  "aplicaciones.html",
  "educacion.html",
  "codigo.html",
  "video.html",
  "conclusion.html",
  "css/estilos.css",
  "js/pwa.js",
  "img/logo-cbtis260.jpg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/apple-touch-icon.png"
];

// Instalación: guarda los archivos (si alguno falta, no detiene a los demás)
self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(ARCHIVOS.map((a) => cache.add(a).catch(() => null)))
    ).then(() => self.skipWaiting())
  );
});

// Activación: borra cachés de versiones anteriores
self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(
        claves.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Con internet: usa la versión más nueva. Sin internet: usa la guardada.
self.addEventListener("fetch", (evento) => {
  const peticion = evento.request;
  if (peticion.method !== "GET") return;
  if (new URL(peticion.url).origin !== self.location.origin) return;

  evento.respondWith(
    fetch(peticion)
      .then((respuesta) => {
        const copia = respuesta.clone();
        caches.open(CACHE).then((cache) => cache.put(peticion, copia));
        return respuesta;
      })
      .catch(() => caches.match(peticion).then((r) => r || caches.match("index.html")))
  );
});
