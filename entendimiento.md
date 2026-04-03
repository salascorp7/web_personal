# Entendimiento del Proyecto: SalasCorp

**URL en producción:** https://salascorp-2feacc83ec90.herokuapp.com/  
**Fecha de análisis:** 2026-04-03  
**Repositorio local:** `C:\Users\salas\projects\python_projects\15_bootstrap`  
**Rama principal Git:** `main` / `gh-pages`

---

## 1. Estructura de Archivos

```
15_bootstrap/
├── home.html           → Página principal (todo el contenido)
├── index.php           → Entry point: solo hace include de home.html
├── index.css           → Estilos personalizados (~85 líneas)
├── index.js            → JS mínimo (~3 líneas: inicializa tooltips Bootstrap)
├── juego.html          → Juego HTML5 Canvas (Sonic-like, autónomo)
├── Procfile            → Configuración de Heroku (buildpack PHP)
├── composer.json       → Vacío ({}) — requerido por el buildpack PHP de Heroku
└── assets/
    ├── images/         → Imágenes del hero/carousel y foto de perfil
    └── speakers/       → Imágenes de los proyectos (tarjetas)
```

---

## 2. Stack Tecnológico

### Infraestructura
| Componente | Tecnología | Versión/Detalles |
|---|---|---|
| Hosting | Heroku | Plan Free/Eco |
| Buildpack | heroku/php | Sirve archivos estáticos vía Apache |
| Entry point | PHP | `index.php` hace `include_once("home.html")` |
| Dominio | Heroku subdomain | `salascorp-2feacc83ec90.herokuapp.com` |

### Frontend
| Componente | Tecnología | Versión |
|---|---|---|
| Framework CSS | Bootstrap | **4.1.3** (via CDN StackPath) |
| Interactividad JS | jQuery | 3.3.1 slim (via CDN) |
| Posicionamiento de popovers | Popper.js | 1.14.3 (via CDN) |
| CSS personalizado | `index.css` | Personalización mínima |
| JS personalizado | `index.js` | Solo inicialización de tooltips |

### Analytics y Tracking
| Herramienta | ID |
|---|---|
| Google Analytics 4 | `G-SCLP3BF6CH` |
| Google Tag Manager | `GTM-P2F4MMGP` |

---

## 3. Arquitectura General

```
Usuario (Browser)
       │
       ▼
  Heroku (Apache + PHP buildpack)
       │
       ▼
  index.php → include_once("home.html")
       │
       ▼
  home.html (SPA estática)
  ├── Navbar Bootstrap (sticky)
  ├── Hero Carousel (3 imágenes locales)
  ├── Grid de Proyectos (Bootstrap 3-cols)
  │     └── 9 tarjetas → links a apps externas
  ├── Sección "Acerca de Mí"
  └── Footer con links a LinkedIn
```

La arquitectura es una **SPA estática** (HTML/CSS/JS puro) servida mediante PHP como simple intermediario. No hay lógica de backend real. Todos los proyectos mostrados son aplicaciones externas (Heroku, Power BI, Shiny, Looker Studio).

---

## 4. Secciones de la Página

| Sección | Descripción |
|---|---|
| **Header/Navbar** | Logo "Salascorp", links a Inicio / Proyectos / Contacto |
| **Hero / Carousel** | 3 imágenes con overlay: AI, Código, Población |
| **Proyectos** | Grid de 9 tarjetas con badges tecnológicos y links externos |
| **Acerca de Mí** | Foto, nombre Oscar Salas, cargo, link a LinkedIn |
| **Footer** | Links a secciones de LinkedIn: Educación, Experiencia, Certificaciones |
| **Modal (inactivo)** | Formulario de "Comprar tickets" — comentado en el nav |

---

## 5. Proyectos Listados

| # | Proyecto | Stack | Link |
|---|---|---|---|
| 1 | Censo 2018 | AWS, Power BI, Python, PostgreSQL | Power BI embed |
| 2 | GEIH | AWS, Power BI, Python, PostgreSQL | Power BI embed |
| 3 | API Twitter | R, Shiny, API REST | shinyapps.io |
| 4 | Segmentación K-means | Python, Dash, Heroku | Heroku |
| 5 | Cálculo de muestra | Python, Dash, Heroku | Heroku |
| 6 | Monitoreo web (esta página) | Looker Studio, Google Analytics | Looker Studio |
| 7 | Predicción felicidad | Flask, JavaScript, Python, Ajax | Heroku |
| 8 | Predicción impagos TC | AWS, Power BI, Python, PostgreSQL | **SIN LINK (en construcción)** |
| 9 | Juego de Sonic | React, Auth0, Node *(badges desactualizados)* | `juego.html` (local) |

> **Nota:** El juego (`juego.html`) está construido en **Canvas API puro con JavaScript vanilla**, sin React ni Auth0. Los badges del card están desactualizados.

---

## 6. Fortalezas

1. **Diseño responsivo bien implementado** — Grid Bootstrap con `col-12 col-md-6 col-lg-4` en todos los proyectos. Se adapta correctamente a móvil, tablet y escritorio.

2. **Analytics bien integrado** — GA4 + GTM correctamente instalados con doble implementación (script en `<head>` y noscript en `<body>`).

3. **SRI (Subresource Integrity) en CDNs** — Los scripts externos de Bootstrap, jQuery y Popper.js incluyen atributos `integrity` y `crossorigin`, protegiendo contra ataques de supply chain.

4. **Portafolio diversificado** — Proyectos en múltiples tecnologías (BI, ML, R/Shiny, Python/Dash, Flask, Canvas/HTML5) que muestran amplitud técnica.

5. **Juego HTML5 completamente funcional** — `juego.html` es un proyecto técnico interesante e interactivo, 100% vanilla JS con Canvas API, con física, colisiones, progresión por etapas y sistema de puntuación.

6. **Arquitectura simple y de bajo mantenimiento** — Al ser estática con PHP mínimo, no hay bases de datos, sesiones ni autenticación que mantener.

7. **Navbar sticky** — Mejora la experiencia de navegación, especialmente en páginas largas.

8. **Sección "Acerca de mí" con foto** — Humaniza el portafolio y genera confianza.

---

## 7. Puntos de Mejora

### Bugs y Problemas Críticos

| # | Problema | Ubicación | Impacto |
|---|---|---|---|
| 1 | **`<a>` anidado dentro de `<a>`** | `home.html:44-45` — `<a class="navbar-brand"><a class="nav-link">` | HTML inválido, comportamiento impredecible en navegadores |
| 2 | **Link vacío** | `home.html:243` — `href=""` en "Predicción impagos TC" | Al hacer clic recarga la página en lugar de ir a ningún lado |
| 3 | **HTML mal estructurado** | `home.html:214` — Se abre un `<div class="row">` adicional dentro de un `.row` existente sin cerrar el anterior | Layout roto en proyectos 7-9, salen desalineados |
| 4 | **Comentario con instrucciones de Git en HTML** | `home.html:355-358` | Información técnica expuesta en el código fuente del cliente |
| 5 | **Ruta de imagen con espacio** | `assets/speakers/Mi proyecto.jpg` | Posibles errores de codificación URL en algunos servidores |

### Mejoras de Calidad / SEO

| # | Problema | Recomendación |
|---|---|---|
| 6 | **`lang="en"` pero contenido en español** | Cambiar a `lang="es"` en `home.html:2` |
| 7 | **Sin meta descripción ni Open Graph** | Agregar `<meta name="description">`, `og:title`, `og:image` para SEO y redes sociales |
| 8 | **Sin favicon** | Agregar `<link rel="icon">` con el logo de SalasCorp |
| 9 | **Badges del Juego de Sonic incorrectos** | Dice React/Auth0/Node pero es Canvas/JavaScript puro |
| 10 | **`juego.html` sin tracking** | El juego no tiene GA/GTM, no se mide el tráfico a esa página |
| 11 | **Sin robots.txt ni sitemap.xml** | Beneficioso para indexación en buscadores |

### Deuda Técnica

| # | Problema | Recomendación |
|---|---|---|
| 12 | **Bootstrap 4.1.3 (2018)** | Actualizar a Bootstrap 5.x — elimina dependencia de jQuery, mejor componentes |
| 13 | **jQuery innecesario** | Con Bootstrap 5, jQuery no es requerido. El `index.js` actual solo inicializa tooltips |
| 14 | **Modal "Comprar tickets" es código muerto** | El botón está comentado en el nav. Eliminar el modal del HTML o activarlo |
| 15 | **Assets no referenciados** | `honolulu.jpg`, `portada.jpg`, `bandera.png`, `colombia.png`, `gpt.jpg`, etc. no se usan en ninguna página visible |
| 16 | **`Procfile` con contenido incorrecto** | Contiene `heroku buildpacks:set heroku/php` que es un comando CLI, no una directiva válida de Procfile. Heroku ignora esto y funciona porque detecta el buildpack por `composer.json`, pero es confuso |

### Mejoras de Rendimiento

| # | Mejora | Descripción |
|---|---|---|
| 17 | **Preconnect a CDNs** | Agregar `<link rel="preconnect" href="https://stackpath.bootstrapcdn.com">` etc. para reducir latencia |
| 18 | **Optimización de imágenes** | Las imágenes del carousel y tarjetas no tienen tamaños `width`/`height` definidos, causando layout shift (CLS) |
| 19 | **Lazy loading** | Agregar `loading="lazy"` a las imágenes de las tarjetas de proyectos |

---

## 8. Diagrama de Dependencias Externas

```
SalasCorp (Heroku)
├── CDN StackPath Bootstrap 4.1.3
├── CDN jQuery 3.3.1 slim
├── CDN CloudFlare Popper.js 1.14.3
├── Google Analytics (G-SCLP3BF6CH)
├── Google Tag Manager (GTM-P2F4MMGP)
└── Proyectos externos:
    ├── app.powerbi.com (Power BI) × 2
    ├── salascorp.shinyapps.io (R/Shiny)
    ├── segmentacion-*.herokuapp.com
    ├── muestra-*.herokuapp.com
    ├── modelofelicidad-*.herokuapp.com
    └── datastudio.google.com (Looker Studio)
```

---

## 9. Resumen Ejecutivo

**SalasCorp** es un portafolio personal de Oscar Salas (Ingeniero Industrial) desplegado en Heroku usando un buildpack PHP mínimo para servir una página HTML estática. Es un sitio de presentación profesional enfocado en proyectos de **Inteligencia Artificial, Data Science y Business Intelligence**.

**Tecnicamente** es funcional y responsivo, con buenas prácticas de seguridad en CDNs (SRI) y tracking bien configurado. Los principales puntos a resolver son el HTML mal estructurado en la sección de proyectos (fila anidada incorrectamente), el link vacío del proyecto en construcción, y actualizar los badges del juego que son incorrectos.

**La mayor oportunidad de mejora** es actualizar Bootstrap a v5, agregar meta-SEO básica, y corregir los 5 bugs identificados en la sección de problemas críticos para garantizar compatibilidad y comportamiento consistente entre navegadores.
