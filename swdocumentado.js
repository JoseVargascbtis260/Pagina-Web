// ============================================================
// Service Worker - IA CBTIS 260
// ============================================================
// Un service worker es un script que corre en segundo plano,
// separado de la página. Permite que la PWA funcione sin
// internet guardando (cacheando) los archivos en el dispositivo.
// ============================================================

// Número de versión del caché.
// IMPORTANTE: cámbialo (v2, v3...) cada vez que actualices la página,
// para que los usuarios reciban los archivos nuevos y se borre el caché viejo.
const VERSION = "v1";

// Nombre del caché donde se guardan los archivos.
// Se forma uniendo el texto "ia-cbtis260-" con la versión (ej. "ia-cbtis260-v1").
const CACHE = "ia-cbtis260-" + VERSION;

// Lista de archivos que se guardan al instalar la app
// para que estén disponibles sin conexión.
const ARCHIVOS = [
  "./",                              // Raíz del sitio (carpeta principal)
  "index.html",                      // Página de inicio
  "que-es.html",                     // Página: Qué es la IA
  "antecedentes.html",               // Página: Antecedentes / historia
  "tipos.html",                      // Página: Tipos de IA
  "como-funciona.html",              // Página: Cómo funciona
  "generativa.html",                 // Página: IA generativa
  "aplicaciones.html",               // Página: Aplicaciones
  "educacion.html",                  // Página: IA en la educación
  "codigo.html",                     // Página: Código
  "video.html",                      // Página: Video
  "conclusion.html",                 // Página: Conclusión
  "css/estilos.css",                 // Hoja de estilos (diseño)
  "js/pwa.js",                       // Script que registra la PWA
  "img/logo-cbtis260.jpg",           // Logo de la escuela
  "icons/icon-192.png",              // Ícono 192x192 de la PWA
  "icons/icon-512.png",              // Ícono 512x512 de la PWA
  "icons/apple-touch-icon.png"       // Ícono para dispositivos Apple
];

// ------------------------------------------------------------
// EVENTO INSTALL
// Se ejecuta una sola vez cuando el navegador instala este
// service worker por primera vez (o cuando cambia el archivo).
// Aquí se guardan los archivos en el caché.
// ------------------------------------------------------------
self.addEventListener("install", (evento) => {
  // waitUntil: le dice al navegador que espere a que termine
  // esta tarea antes de dar por terminada la instalación.
  evento.waitUntil(
    // Abre (o crea) el caché con el nombre definido arriba.
    caches.open(CACHE).then((cache) =>
      // Recorre la lista de archivos y trata de guardar cada uno.
      // Promise.all espera a que todos terminen.
      Promise.all(
        // cache.add descarga el archivo y lo guarda en el caché.
        // .catch(() => null): si un archivo falta o falla, lo ignora
        // para que no se cancele la instalación completa.
        ARCHIVOS.map((a) => cache.add(a).catch(() => null))
      )
    // Cuando termina de guardar todo, skipWaiting activa este
    // service worker de inmediato, sin esperar a que se cierren
    // las pestañas abiertas.
    ).then(() => self.skipWaiting())
  );
});

// ------------------------------------------------------------
// EVENTO ACTIVATE
// Se ejecuta cuando el service worker ya quedó instalado y
// toma el control. Aquí se limpian los cachés antiguos.
// ------------------------------------------------------------
self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    // caches.keys() devuelve los nombres de todos los cachés guardados.
    caches.keys()
      .then((claves) => Promise.all(
        // filter: se queda solo con los cachés que NO son el actual
        // (es decir, los de versiones anteriores).
        // map: borra cada uno de esos cachés viejos.
        claves.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      ))
      // clients.claim: hace que este service worker controle de
      // inmediato las páginas abiertas, sin necesidad de recargar.
      .then(() => self.clients.claim())
  );
});

// ------------------------------------------------------------
// EVENTO FETCH
// Se ejecuta cada vez que la página pide un recurso (HTML, CSS,
// imagen, etc.). Estrategia usada: "primero la red, si falla
// el caché":
//   - Con internet: descarga la versión más nueva y la guarda.
//   - Sin internet: usa la copia guardada en el caché.
// ------------------------------------------------------------
self.addEventListener("fetch", (evento) => {
  // Guarda la petición que hizo la página en una variable.
  const peticion = evento.request;

  // Si la petición no es GET (por ejemplo POST), no se intercepta.
  if (peticion.method !== "GET") return;

  // Si el recurso viene de otro sitio (otro dominio), no se
  // intercepta; solo se manejan archivos de tu propio sitio.
  if (new URL(peticion.url).origin !== self.location.origin) return;

  // respondWith: aquí se decide qué respuesta recibe la página.
  evento.respondWith(
    // 1) Intenta descargar el recurso desde internet.
    fetch(peticion)
      .then((respuesta) => {
        // Hace una copia de la respuesta (una respuesta solo se
        // puede leer una vez, por eso se clona).
        const copia = respuesta.clone();
        // Guarda la copia en el caché para tener siempre la
        // versión más reciente disponible sin conexión.
        caches.open(CACHE).then((cache) => cache.put(peticion, copia));
        // Entrega la respuesta original a la página.
        return respuesta;
      })
      // 2) Si falla la red (sin internet), busca en el caché.
      //    Si el archivo no está guardado, muestra index.html
      //    como respaldo.
      .catch(() => caches.match(peticion).then((r) => r || caches.match("index.html")))
  );
});