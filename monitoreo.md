# Monitoreo Web — Google Analytics + GTM + Looker Studio + Dashboard propio

Guía de referencia para replicar el setup de monitoreo en otros proyectos.

---

## Credenciales e IDs del proyecto actual (SalasCorp)

| Recurso                        | ID / Valor                           |
|--------------------------------|--------------------------------------|
| GA4 Measurement ID (web)       | `G-SCLP3BF6CH`                       |
| GA4 Property ID (web)          | `271107103`                          |
| GA4 Measurement ID (financiero)| `G-TDL763JVMY`                       |
| GA4 Property ID (financiero)   | `534540730`                          |
| GTM Container ID               | `GTM-P2F4MMGP`                       |
| Cuenta Google                  | salascorp@gmail.com                  |
| Service Account                | gsheets-links@salascorp-poc-gcp.iam.gserviceaccount.com |
| Sheet ID                       | `1O8IgiaGUP9HsnHvE2lnmThZyfZ__g0ZLkD7eFF5pcs8` |
| Pestaña web principal          | `analytics_salascorp`                |
| Pestaña monitoreo financiero   | `analytics_monitoreo_financiero`     |
| Looker Studio dashboard        | https://datastudio.google.com/s/kEuknYGkkms |

---

## Arquitectura completa del sistema

```
Visitante navega la web
        ↓
GTM detecta evento (carga inicial o cambio de ruta SPA)
        ↓
Tag de GA4 se dispara → envía page_view
        ↓
Google Analytics 4 almacena los datos
        ↓
        ├── Looker Studio consulta GA4 directamente → dashboard externo
        │
        └── Cron diario (1am Colombia) → GA4 Data API → Google Sheets
                                                              ↓
                                              Dashboard /monitoreo en la web (solo admin)
```

---

## 1. Google Analytics 4

### Crear una propiedad nueva
1. Ir a analytics.google.com
2. Admin (engranaje abajo izquierda) → Crear propiedad
3. Nombre, zona horaria (Colombia: UTC-5), moneda (COP)
4. Crear flujo de datos → Web → ingresar URL del proyecto
5. Copiar el **Measurement ID** (`G-XXXXXXXXXX`) y el **Property ID** numérico (Admin → Configuración de la propiedad)

### Código de instalación en index.html
Pegar en el `<head>` antes de cualquier otro script:

```html
<!-- Preconnect -->
<link rel="preconnect" href="https://www.googletagmanager.com" />
<link rel="preconnect" href="https://www.google-analytics.com" />

<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

Reemplazar `G-XXXXXXXXXX` con el Measurement ID del nuevo proyecto.

---

## 2. Google Tag Manager

### Crear un contenedor nuevo
1. Ir a tagmanager.google.com
2. Crear cuenta → Crear contenedor → Web
3. Copiar el **Container ID** (`GTM-XXXXXXX`)

### Código de instalación en index.html
En el `<head>` (después del snippet de GA4):

```html
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>
```

Al inicio del `<body>`:

```html
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
```

### Configuración dentro de GTM para SPAs (React, Vue, Angular)

Las SPAs no recargan la página al navegar — GA4 solo registraría la carga inicial.
La solución es configurar un trigger de "Cambio en el historial" en GTM.

#### Paso 1 — Activar variables incorporadas
Variables → Configurar → activar:
- Page URL
- Page Path
- Page Hostname

#### Paso 2 — Crear el Trigger de History Change
1. Activadores → Nuevo
2. Nombre: `Trigger - History Change`
3. Tipo: **Cambio en el historial**
4. Se activa en: Todos los cambios de historial
5. Guardar

#### Paso 3 — Configurar la etiqueta de GA4
Buscar la etiqueta existente de GA4 (tipo "Etiqueta de Google" con el Measurement ID) y:
1. Abrir la etiqueta → sección "Activadores de accionamiento"
2. Agregar el trigger `Trigger - History Change`
3. Guardar

Con esto la etiqueta se dispara en:
- Carga inicial → trigger `Initialization - All Pages`
- Cada cambio de ruta → trigger `Trigger - History Change`

#### Paso 4 — Verificar y publicar
1. Clic en "Vista previa" → ingresar URL del sitio
2. Navegar entre páginas y verificar que el tag se dispara en cada ruta
3. Cerrar vista previa → "Enviar" → publicar

---

## 3. Looker Studio

### Conectar GA4 como fuente de datos
1. Ir a lookerstudio.google.com
2. Crear informe → Agregar datos → Google Analytics
3. Seleccionar cuenta → propiedad con el Measurement ID correcto
4. Agregar al informe

### Reconectar si aparece error de credenciales
Si aparece "Error de configuración de credenciales":
1. Recursos → Gestionar las fuentes de datos
2. Editar la fuente de GA4
3. Clic en "Editar conexión" (arriba derecha)
4. Volver a seleccionar la cuenta y propiedad correcta
5. Reconectar → Aplicar → Guardar

### Métricas útiles para un dashboard de tráfico web

| Métrica            | Descripción                              |
|--------------------|------------------------------------------|
| Sesiones           | Número total de visitas                  |
| Usuarios activos   | Usuarios únicos en el período            |
| Páginas por sesión | Promedio de páginas vistas por visita    |
| Duración media     | Tiempo promedio en el sitio              |
| Tasa de rebote     | % que sale sin interactuar               |
| Página de destino  | Primera página visitada en cada sesión   |
| Página más vista   | Ruta con más page_views (`/`, `/links`)  |
| Dispositivo        | Móvil vs desktop vs tablet               |
| País / Ciudad      | Origen geográfico del tráfico            |

---

## 4. GA4 Data API → Google Sheets (histórico acumulado)

Extrae datos de GA4 via API y los guarda en Google Sheets para tener un histórico propio acumulado día a día. Los datos se visualizan en el dashboard `/monitoreo` de la web (solo admin).

### Requisitos en GCP para cada propiedad nueva

1. Habilitar **Google Analytics Data API** (no confundir con "Google Analytics API"):
   `console.developers.google.com/apis/api/analyticsdata.googleapis.com/overview?project=<PROJECT_NUMBER>`
2. Dar acceso **Lector** a la service account en GA4:
   Admin → Administración de acceso a la propiedad → agregar `gsheets-links@salascorp-poc-gcp.iam.gserviceaccount.com`
3. Crear la pestaña en el sheet con los encabezados en la fila 1 (ver columnas abajo)
4. Agregar variables de entorno en `.env` y en Heroku config vars

### Variables de entorno

```
GA4_PROPERTY_ID=534540730         # Monitoreo Financiero
GA4_PROPERTY_ID2=271107103        # SalasCorp Web
```

Para agregar en Heroku:
```bash
heroku config:set GA4_PROPERTY_ID=534540730 GA4_PROPERTY_ID2=271107103
```

### Propiedades configuradas

| Variable env       | Property ID | Measurement ID  | Pestaña sheet                    |
|--------------------|-------------|-----------------|----------------------------------|
| `GA4_PROPERTY_ID`  | `534540730` | `G-TDL763JVMY`  | `analytics_monitoreo_financiero` |
| `GA4_PROPERTY_ID2` | `271107103` | `G-SCLP3BF6CH`  | `analytics_salascorp`            |

### Columnas de cada pestaña (fila 1 = encabezados, datos desde fila 2)

| Columna            | Fuente GA4 API                          |
|--------------------|-----------------------------------------|
| `fecha`            | Fecha del día (YYYY-MM-DD)              |
| `sesiones`         | `sessions`                              |
| `usuarios`         | `activeUsers`                           |
| `nuevos_usuarios`  | `newUsers`                              |
| `page_views`       | `screenPageViews`                       |
| `duracion_seg`     | `averageSessionDuration`                |
| `tasa_rebote`      | `bounceRate` (valor entre 0 y 1)        |
| `pagina_top`       | `pagePath` con más vistas               |
| `canal_top`        | `sessionDefaultChannelGroup` top        |
| `dispositivo_top`  | `deviceCategory` top                    |
| `pais_top`         | `country` top                           |

> `tasa_rebote` se almacena entre 0 y 1. Para mostrar como porcentaje: `valor * 100`.

### Endpoints en server.js

| Endpoint               | Método | Auth       | Descripción |
|------------------------|--------|------------|-------------|
| `/api/analytics/sync`  | POST   | JWT admin  | Sincroniza todas las propiedades (ayer) |
| `/api/analytics?tab=X` | GET    | JWT admin  | Devuelve histórico de una pestaña específica |

Tabs válidas para `?tab=`: `analytics_salascorp`, `analytics_monitoreo_financiero`

### Cron automático
`node-cron` corre cada día a las **6am UTC = 1am hora Colombia**:
```js
cron.schedule('0 6 * * *', () => syncAllProperties())
```
Sincroniza todas las propiedades del array `GA4_PROPERTIES` en `server.js` en paralelo.

### Para agregar una propiedad nueva al sync
En `server.js`, agregar al array `GA4_PROPERTIES`:
```js
const GA4_PROPERTIES = [
  { propertyId: process.env.GA4_PROPERTY_ID,  sheetTab: 'analytics_monitoreo_financiero' },
  { propertyId: process.env.GA4_PROPERTY_ID2, sheetTab: 'analytics_salascorp' },
  // nueva propiedad:
  { propertyId: process.env.GA4_PROPERTY_ID3, sheetTab: 'analytics_nuevo_proyecto' },
]
```
Y en el dashboard `Monitoreo.jsx`, agregar al array `WEBS`:
```js
const WEBS = [
  { label: 'SalasCorp Web',        tab: 'analytics_salascorp'            },
  { label: 'Monitoreo Financiero', tab: 'analytics_monitoreo_financiero' },
  { label: 'Nuevo Proyecto',       tab: 'analytics_nuevo_proyecto'       },
]
```

### Dependencia instalada
```
node-cron — scheduling del cron diario
```

---

## 5. Dashboard /monitoreo (web propia, solo admin)

Ruta `/monitoreo` en la web, accesible solo para usuarios con rol `admin`. Se encuentra en el sidebar bajo la sección "Admin".

### Contenido del dashboard

- **Selector de web** — cambia entre todas las propiedades configuradas
- **6 KPI cards**: sesiones totales, usuarios, page views, duración promedio (mm:ss), tasa de rebote (%), días registrados
- **Gráfica de línea SVG** — sesiones diarias de los últimos 30 días (construida sin librería externa)
- **Top 5 histórico** — páginas más visitadas, canal de adquisición, dispositivos, países (frecuencia entre todos los días)
- **Tabla de registros recientes** — últimos 15 días con todas las columnas

### Archivos relevantes

| Archivo | Descripción |
|---------|-------------|
| `src/components/Monitoreo.jsx` | Componente principal del dashboard |
| `src/hooks/useMonitoreo.js`    | Hook que fetch `/api/analytics?tab=X` con JWT |

### Nota de diseño
- Fondo oscuro `#0f172a` en toda la página, consistente con el resto del panel admin
- Tabla: filas con `background: #0f172a`, hover `#1e293b` — importante para evitar texto gris sobre fondo blanco
- Gráfica SVG: usa `preserveAspectRatio` y `viewBox` para ser responsiva sin librerías

---

## Checklist para un proyecto nuevo

- [ ] Crear propiedad GA4 → copiar Measurement ID (`G-XXXXXXXXXX`) y Property ID numérico
- [ ] Crear contenedor GTM → copiar Container ID (`GTM-XXXXXXX`)
- [ ] Pegar ambos snippets en `index.html`
- [ ] Activar variables incorporadas en GTM (Page URL, Path, Hostname)
- [ ] Crear trigger "Cambio en el historial" en GTM
- [ ] Agregar trigger a la etiqueta de GA4 existente
- [ ] Verificar con Vista previa de GTM y publicar
- [ ] Habilitar **Google Analytics Data API** en GCP
- [ ] Dar acceso Lector a la service account en la propiedad GA4
- [ ] Crear pestaña en el sheet con los 11 encabezados en fila 1
- [ ] Agregar `GA4_PROPERTY_IDn` en `.env` y en Heroku config vars
- [ ] Agregar propiedad al array `GA4_PROPERTIES` en `server.js`
- [ ] Agregar web al array `WEBS` en `Monitoreo.jsx`
- [ ] Verificar sync manual y confirmar fila en el sheet
- [ ] Conectar pestaña del sheet como fuente en Looker Studio (opcional)

---

## Notas importantes

- Los datos en GA4 tardan **24-48 horas** en aparecer en informes históricos. El informe de **Tiempo real** es inmediato.
- GTM y GA4 son plataformas separadas — GTM envía los eventos, GA4 los almacena.
- Para SPAs (React Router, Vue Router, etc.), el trigger **"Cambio en el historial"** en GTM es obligatorio.
- El `bounceRate` de la GA4 Data API viene entre 0 y 1 — multiplicar por 100 para mostrar como %.
- El cron usa `node-cron` dentro del proceso de Node.js — funciona bien en Heroku dynos pagos (siempre activos). En dynos gratuitos (que duermen) el cron no correría.
- El sync no duplica fechas: antes de escribir verifica si la fecha ya existe en la columna A del sheet.
- Hay dos APIs distintas en GCP — habilitar **"Google Analytics Data API"**, no "Google Analytics API" (la vieja, para Universal Analytics).
