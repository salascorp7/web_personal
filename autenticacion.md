# Autenticación Google OAuth — Documentación de Implementación

Referencia técnica del sistema de autenticación implementado en este proyecto.
Stack: **React + Vite + Flask + Heroku**.

---

## Resumen del flujo

```
1. Usuario abre la app → ve pantalla de login
2. Click "Continuar con Google" → popup de Google
3. Google verifica identidad → retorna un ID token (JWT de Google)
4. Frontend envía ese token al backend Flask
5. Flask verifica el token con la API de Google → extrae el email
6. Flask busca el email en la lista de autorizados → asigna rol
7. Flask genera su propio JWT con {email, role, name, exp}
8. Frontend guarda el JWT en localStorage
9. Cada llamada a la API incluye el JWT en el header Authorization
10. Flask verifica el JWT en cada endpoint protegido
```

---

## Prerequisitos — Cómo se configuró realmente Google Cloud en este proyecto

> Esto es el registro exacto de lo que funcionó y lo que falló al intentar
> hacer todo por CLI. Sirve para no repetir los mismos intentos fallidos.

---

### Lo que SÍ funciona por CLI (gcloud)

#### Autenticarse

```bash
gcloud auth login
```
Abre el navegador automáticamente, apruebas con tu cuenta Google y queda
autenticado para todos los comandos siguientes. Solo necesitas hacerlo una vez
por máquina. En este proyecto ya estaba autenticado como `salascorp@gmail.com`.

Verificar:
```bash
gcloud auth list       # muestra la cuenta activa
gcloud config list     # muestra proyecto y cuenta activos
```

#### Crear el proyecto

```bash
gcloud projects create monitoreocreditos --name="Monitoreo Creditos"
gcloud config set project monitoreocreditos
```
Funcionó sin problemas. El ID del proyecto debe ser único globalmente en Google Cloud.

#### Vincular facturación

Sin esto, la mayoría de APIs no se pueden habilitar.

```bash
# Ver tus cuentas de facturación
gcloud billing accounts list

# Vincular
gcloud beta billing projects link monitoreocreditos --billing-account=01BC3F-DBADFC-3EEB45
```

El ID de billing tiene formato `XXXXXX-XXXXXX-XXXXXX`. Lo ves en la columna
`ACCOUNT_ID` del primer comando.

#### Habilitar APIs

```bash
# FALLA — oauth2.googleapis.com es interno, no se puede habilitar así:
gcloud services enable oauth2.googleapis.com  # ❌ No funciona

# Lo que SÍ funcionó para Google Sign-In:
gcloud services enable iap.googleapis.com --project=monitoreocreditos  # ✅

# Para Google Sheets (log de accesos):
gcloud services enable sheets.googleapis.com drive.googleapis.com --project=monitoreocreditos  # ✅
```

**Lección:** `oauth2.googleapis.com` es un servicio interno de Google y no se
puede habilitar por CLI. En su lugar hay que habilitar `iap.googleapis.com`.

#### Crear cuenta de servicio para Google Sheets

Esto sí se hace completamente por CLI:

```bash
# Crear la cuenta
gcloud iam service-accounts create gsheets-logger \
  --display-name="GSheets Logger" \
  --project=monitoreocreditos

# Generar la clave JSON (se guarda en la ruta que indiques)
gcloud iam service-accounts keys create C:/Users/salas/AppData/Local/Temp/gsheets_key.json \
  --iam-account=gsheets-logger@monitoreocreditos.iam.gserviceaccount.com \
  --project=monitoreocreditos

# Ver el email de la cuenta de servicio
python3 -c "import json; d=json.load(open('C:/Users/salas/AppData/Local/Temp/gsheets_key.json')); print(d['client_email'])"
# Resultado: gsheets-logger@monitoreocreditos.iam.gserviceaccount.com

# Encodear a base64 para poder subirla a Heroku como env var
python3 -c "import base64; print(base64.b64encode(open('C:/ruta/gsheets_key.json','rb').read()).decode())" > /tmp/key_b64.txt

# Subir a Heroku
KEY_B64=$(cat /tmp/key_b64.txt)
heroku config:set GOOGLE_SERVICE_ACCOUNT_B64="$KEY_B64" --app creditossalascorp
```

Luego en Google Sheets (este paso sí es manual — no tiene CLI):
Abrir el spreadsheet → **Compartir** → pegar el email de la cuenta de servicio
con permiso de **Editor** → desmarcar "Notificar" → Compartir.

#### Subir variables a Heroku

En Windows con bash, pasar múltiples variables en un solo comando a veces falla
por el encoding de colores de la terminal. Lo que funcionó fue hacerlo **una por una**:

```bash
heroku config:set GOOGLE_CLIENT_ID=910839326610-06leq4up4amlpvr64ob0j3dqigl3c2hm.apps.googleusercontent.com --app creditossalascorp
heroku config:set GOOGLE_CLIENT_SECRET=GOCSPX-... --app creditossalascorp
heroku config:set JWT_SECRET=edc5f2d3... --app creditossalascorp
heroku config:set USUARIOS_ADMIN=salascorp@gmail.com --app creditossalascorp
heroku config:set USUARIOS_VIEWER=lizethsalas0929@gmail.com --app creditossalascorp
heroku config:set GSHEETS_SPREADSHEET_ID=1iFdX6jHg5... --app creditossalascorp
heroku config:set GOOGLE_SERVICE_ACCOUNT_B64="ewogICJ0eXBlIj..." --app creditossalascorp
```

> En Windows el comando devuelve exit code 1 aunque la operación sea exitosa.
> Ignorar ese error — verificar que el valor quedó guardado con `heroku config --app nombre`.

Verificar:
```bash
heroku config --app creditossalascorp
```

---

### Lo que NO funciona por CLI y hay que hacer manualmente

Intenté crear la pantalla de consentimiento OAuth y las credenciales OAuth 2.0
por CLI con dos enfoques distintos, y ambos fallaron:

**Intento 1** — Habilitar `oauth2.googleapis.com`:
```
ERROR: Service 'oauth2.googleapis.com' is an internal service
```
No se puede. Es un servicio interno de Google.

**Intento 2** — Crear brand OAuth vía API REST de IAP:
```bash
curl -X POST "https://iap.googleapis.com/v1/projects/${PROJECT_NUMBER}/brands" ...
# ERROR: Invalid resource field value — RESOURCE_PROJECT_INVALID
```
Tampoco funciona para proyectos externos (no Google Workspace).

**Conclusión:** La pantalla de consentimiento OAuth y el Client ID de tipo
"Aplicación web" **solo se pueden crear desde la consola web**. No hay forma
de hacerlo por CLI para proyectos externos. Son exactamente estos 2 pasos:

---

### ⚠️ Los 2 pasos manuales obligatorios en consola web

#### Paso A — Pantalla de consentimiento OAuth

1. Ir a `console.cloud.google.com` → seleccionar el proyecto
2. Menú izquierdo: **APIs y servicios → Pantalla de consentimiento de OAuth**
3. Tipo de usuario: **Externo** → **Crear**
4. Llenar solo los campos obligatorios:
   - Nombre de la app: el nombre de tu proyecto
   - Correo de asistencia al usuario: tu correo
   - Información de contacto del desarrollador: tu correo
5. **Guardar y continuar** en las siguientes pantallas sin agregar nada
6. Al final: **Volver al panel**

> Si ves el mensaje "Para crear un ID de cliente OAuth primero debes configurar
> la pantalla de consentimiento" al intentar crear credenciales, es porque
> saltaste este paso.

#### Paso B — Crear credencial OAuth 2.0

1. **APIs y servicios → Credenciales → Crear credenciales → ID de cliente OAuth 2.0**
2. Tipo de aplicación: **Aplicación web**
3. Nombre: cualquier nombre descriptivo (ej: `creditossalascorp`)
4. **Orígenes autorizados de JavaScript** — agregar los dos:
   ```
   http://localhost:3000
   https://tu-app-fd4f3b6603a0.herokuapp.com
   ```
5. **URIs de redireccionamiento**: dejar vacío
6. **Crear**
7. En el popup que aparece, copiar el **Client ID**
   - Formato: `910839326610-xxxxxxxx.apps.googleusercontent.com`
   - El Client Secret (`GOCSPX-...`) guárdalo pero no lo usarás en el código
   - También puedes descargar el JSON con ambos valores

> El Client ID es público — puede estar hardcodeado en el frontend sin problema.
> El Client Secret debe mantenerse privado — guárdalo en tus env vars por si acaso.

---

### Resumen: qué hace cada parte

| Qué | Cómo | Por qué |
|-----|------|---------|
| Autenticarse en gcloud | `gcloud auth login` | Habilita todos los comandos CLI |
| Crear proyecto | `gcloud projects create` | CLI ✅ |
| Vincular billing | `gcloud beta billing projects link` | CLI ✅ — sin esto no se habilitan APIs |
| Habilitar APIs | `gcloud services enable iap.googleapis.com` | CLI ✅ — NO usar oauth2.googleapis.com |
| Pantalla de consentimiento | Consola web | ❌ No tiene CLI para proyectos externos |
| Client ID OAuth 2.0 | Consola web | ❌ No tiene CLI para proyectos externos |
| Cuenta de servicio | `gcloud iam service-accounts create` | CLI ✅ completo |
| Clave JSON de SA | `gcloud iam service-accounts keys create` | CLI ✅ |
| Compartir Sheet con SA | Consola de Google Sheets | Manual — 1 click |
| Variables en Heroku | `heroku config:set` una por una | CLI ✅ — en Windows hacerlas separadas |

---

## Variables de entorno necesarias

### En Heroku (o `.env` local)

```bash
# Google OAuth
GOOGLE_CLIENT_ID=xxxxxxxxxxxx-xxxxxxxx.apps.googleusercontent.com

# JWT para sesiones propias
JWT_SECRET=una_clave_larga_aleatoria_minimo_32_chars

# Usuarios autorizados por rol (separados por coma)
USUARIOS_ADMIN=admin@gmail.com
USUARIOS_VIEWER=viewer1@gmail.com,viewer2@gmail.com
```

Agregar a Heroku:
```bash
heroku config:set GOOGLE_CLIENT_ID=... --app nombre-app
heroku config:set JWT_SECRET=$(openssl rand -hex 32) --app nombre-app
heroku config:set USUARIOS_ADMIN=correo@gmail.com --app nombre-app
heroku config:set USUARIOS_VIEWER=otro@gmail.com --app nombre-app
```

---

## Dependencias

### Backend (Python)
```
google-auth==2.40.3     # Verificar tokens de Google
PyJWT==2.8.0            # Generar y verificar JWT propios
```

Agregar a `requirements.txt` y ejecutar `pip install -r requirements.txt`.

### Frontend (Node)
```bash
npm install @react-oauth/google
```

---

## Implementación — Backend (Flask)

### 1. Imports y configuración

```python
import jwt
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from functools import wraps
from datetime import datetime, timedelta

GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID', '')
JWT_SECRET       = os.getenv('JWT_SECRET', 'dev_secret_change_me')
USUARIOS_ADMIN   = [e.strip() for e in os.getenv('USUARIOS_ADMIN', '').split(',') if e.strip()]
USUARIOS_VIEWER  = [e.strip() for e in os.getenv('USUARIOS_VIEWER', '').split(',') if e.strip()]
```

### 2. Función de roles

```python
def get_role(email):
    if email in USUARIOS_ADMIN:  return 'admin'
    if email in USUARIOS_VIEWER: return 'viewer'
    return None  # No autorizado
```

### 3. Decorador de protección de endpoints

```python
def requiere_auth(roles=None):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            # Extraer token del header Authorization: Bearer <token>
            token = request.headers.get('Authorization', '').replace('Bearer ', '')
            if not token:
                return jsonify({'error': 'No autorizado'}), 401
            try:
                payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            except jwt.ExpiredSignatureError:
                return jsonify({'error': 'Sesión expirada'}), 401
            except jwt.InvalidTokenError:
                return jsonify({'error': 'Token inválido'}), 401
            # Verificar rol si se especificó
            if roles and payload.get('role') not in roles:
                return jsonify({'error': 'Sin permisos para esta acción'}), 403
            request.user = payload  # Disponible dentro del endpoint
            return f(*args, **kwargs)
        return wrapper
    return decorator
```

### 4. Endpoint de login

```python
@app.route('/api/auth/google', methods=['POST'])
def auth_google():
    data  = request.get_json()
    token = data.get('credential', '')

    # Verificar el token con Google
    try:
        info  = id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            GOOGLE_CLIENT_ID
        )
        email = info.get('email', '')
    except Exception as e:
        return jsonify({'error': f'Token de Google inválido: {str(e)}'}), 401

    # Verificar autorización
    role = get_role(email)
    if not role:
        return jsonify({'error': 'Correo no autorizado'}), 403

    # Generar JWT propio (válido 12 horas)
    payload = {
        'email': email,
        'role':  role,
        'name':  info.get('name', email),
        'exp':   datetime.utcnow() + timedelta(hours=12),
    }
    token_jwt = jwt.encode(payload, JWT_SECRET, algorithm='HS256')

    return jsonify({
        'token': token_jwt,
        'role':  role,
        'name':  info.get('name', email),
        'email': email,
    })
```

> `info` también contiene `info.get('picture')` con la URL de la foto de perfil de Google.

### 5. Proteger endpoints

```python
# Accesible por admin y viewer
@app.route('/api/dashboard')
@requiere_auth(roles=['admin', 'viewer'])
def dashboard():
    ...

# Solo admin
@app.route('/api/accion-sensible', methods=['POST'])
@requiere_auth(roles=['admin'])
def accion_sensible():
    ...

# Sin protección (login, health check)
@app.route('/api/auth/google', methods=['POST'])
def auth_google():
    ...
```

---

## Implementación — Frontend (React)

### 1. Envolver la app con GoogleOAuthProvider (`main.jsx`)

```jsx
import { GoogleOAuthProvider } from '@react-oauth/google'

const GOOGLE_CLIENT_ID = 'xxxxxxxxxxxx.apps.googleusercontent.com'

ReactDOM.createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <App />
  </GoogleOAuthProvider>
)
```

> El `GOOGLE_CLIENT_ID` es público — puede estar en el código frontend sin problema.

### 2. Hook de autenticación (`useAuth.js`)

Maneja el estado de sesión, persistencia en `localStorage` y validación de expiración.

```js
const TOKEN_KEY = 'app_token'
const USER_KEY  = 'app_user'

function parseJwt(token) {
  try { return JSON.parse(atob(token.split('.')[1])) }
  catch { return null }
}

function isTokenValid(token) {
  if (!token) return false
  const payload = parseJwt(token)
  if (!payload) return false
  return payload.exp * 1000 > Date.now()  // exp está en segundos, Date.now() en ms
}

export function useAuth() {
  const [user, setUser] = useState(() => {
    const t = localStorage.getItem(TOKEN_KEY)
    if (!isTokenValid(t)) return null
    const stored = localStorage.getItem(USER_KEY)
    return stored ? JSON.parse(stored) : null
  })

  const login = useCallback(async (googleCredential) => {
    const res  = await fetch('/api/auth/google', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ credential: googleCredential }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Error de autenticación')
    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(USER_KEY, JSON.stringify({
      name: data.name, email: data.email, role: data.role
    }))
    setUser({ name: data.name, email: data.email, role: data.role })
    return data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    window.location.reload()
  }, [])

  const getToken = useCallback(() => localStorage.getItem(TOKEN_KEY), [])

  return { user, login, logout, getToken, isAuthenticated: !!user }
}
```

### 3. Componente de login (`Login.jsx`)

```jsx
import { GoogleLogin } from '@react-oauth/google'

export default function Login({ onLogin }) {
  const [error,   setError]   = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSuccess = async (credentialResponse) => {
    setLoading(true)
    setError(null)
    try {
      await onLogin(credentialResponse.credential)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white rounded-2xl border p-10 max-w-sm w-full text-center">
        <h1>Mi App</h1>
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => setError('Error al iniciar sesión con Google')}
          useOneTap       // Muestra el popup automático si ya hay sesión Google activa
          theme="outline"
          shape="rectangular"
          text="continue_with"
          locale="es"
        />
        {error && <p className="text-red-500 text-xs mt-3">{error}</p>}
      </div>
    </div>
  )
}
```

### 4. Integración en App.jsx

```jsx
export default function App() {
  const { user, login, logout, getToken, isAuthenticated } = useAuth()
  const isAdmin  = user?.role === 'admin'
  const isViewer = user?.role === 'viewer'

  // Mostrar login si no está autenticado
  if (!isAuthenticated) return <Login onLogin={login} />

  // Incluir token en todas las llamadas a la API
  const fetchData = async () => {
    const res = await fetch('/api/dashboard', {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    ...
  }

  return (
    <div>
      {/* Mostrar/ocultar UI según rol */}
      {isAdmin && <ComponenteAdmin />}
      {/* Botón de cerrar sesión */}
      <button onClick={logout}>Salir</button>
    </div>
  )
}
```

---

## Sistema de roles

### Definición de roles

Los roles se definen en variables de entorno en el servidor.
No requiere base de datos — es una lista de emails por rol.

```bash
USUARIOS_ADMIN=admin@gmail.com
USUARIOS_VIEWER=persona1@gmail.com,persona2@gmail.com
```

Para agregar un nuevo viewer en Heroku:
```bash
heroku config:set USUARIOS_VIEWER=nuevo@gmail.com,existente@gmail.com --app nombre-app
```

### Control de acceso en el frontend

```jsx
const isAdmin  = user?.role === 'admin'
const isViewer = user?.role === 'viewer'

// Secciones visibles por rol
const SECCIONES_VIEWER = ['clientes', 'calendario', 'tabla']

// En el sidebar: filtrar ítems de navegación
const navItems = isAdmin ? ALL_NAV_ITEMS : ALL_NAV_ITEMS.filter(
  item => SECCIONES_VIEWER.includes(item.id)
)

// En el contenido: renderizado condicional
{isAdmin && <KpiGrid />}               // Solo admin
{activeSection === 'clientes' && <GroupedTable isAdmin={isAdmin} />}  // Ambos, pero con prop
```

### Control de acceso en el backend

```python
@app.route('/api/endpoint')
@requiere_auth(roles=['admin'])          # Solo admin
@requiere_auth(roles=['admin', 'viewer']) # Ambos roles
def mi_endpoint():
    role = request.user['role']  # Disponible gracias al decorador
    ...
```

---

## Preview de rol (feature adicional)

Permite al admin ver la app como si fuera viewer, sin cerrar sesión.
Útil para verificar que las restricciones funcionan correctamente.

```jsx
const [previewViewer, setPreviewViewer] = useState(false)

// Roles efectivos (no el rol real del token)
const isAdmin  = user?.role === 'admin' && !previewViewer
const isViewer = user?.role === 'viewer' || (user?.role === 'admin' && previewViewer)

const togglePreview = useCallback(() => {
  setPreviewViewer(v => {
    const next = !v
    setActiveSection(next ? 'seccion_viewer_default' : 'seccion_admin_default')
    return next
  })
}, [])

// Botón — solo visible para admin real
{user?.role === 'admin' && (
  <button onClick={togglePreview}>
    {previewViewer ? 'Volver a Admin' : 'Ver como Viewer'}
  </button>
)}

// Banner de advertencia cuando está en modo preview
{previewViewer && (
  <div className="bg-amber-50 border-b border-amber-200 px-5 py-2">
    Modo vista previa — estás viendo la app como Viewer
  </div>
)}
```

> Pasar `role={isAdmin ? 'admin' : 'viewer'}` al Sidebar (el rol efectivo,
> no `user?.role`) para que el menú también refleje el modo preview.

---

## Checklist para replicar en otro proyecto

### Google Cloud
- [ ] Crear proyecto en console.cloud.google.com
- [ ] Configurar pantalla de consentimiento OAuth (Externo)
- [ ] Crear credencial OAuth 2.0 tipo "Aplicación web"
- [ ] Agregar los orígenes autorizados (localhost + producción)
- [ ] Copiar el Client ID

### Backend
- [ ] Agregar `google-auth` y `PyJWT` a `requirements.txt`
- [ ] Copiar las funciones `get_role`, `requiere_auth`, y el endpoint `/api/auth/google`
- [ ] Configurar las variables de entorno (`GOOGLE_CLIENT_ID`, `JWT_SECRET`, `USUARIOS_ADMIN`, `USUARIOS_VIEWER`)
- [ ] Aplicar `@requiere_auth` a cada endpoint que deba protegerse

### Frontend
- [ ] `npm install @react-oauth/google`
- [ ] Envolver `<App>` con `<GoogleOAuthProvider clientId={...}>` en `main.jsx`
- [ ] Copiar el hook `useAuth.js` (cambiar `TOKEN_KEY` y `USER_KEY` a nombres únicos de la app)
- [ ] Copiar el componente `Login.jsx` (personalizar el diseño)
- [ ] En `App.jsx`: mostrar `<Login>` si `!isAuthenticated`
- [ ] Incluir `Authorization: Bearer ${getToken()}` en todas las llamadas a la API
- [ ] Agregar lógica de `isAdmin` / `isViewer` para mostrar/ocultar UI

### Heroku
- [ ] `heroku config:set GOOGLE_CLIENT_ID=...`
- [ ] `heroku config:set JWT_SECRET=$(openssl rand -hex 32)`
- [ ] `heroku config:set USUARIOS_ADMIN=correo@gmail.com`
- [ ] `heroku config:set USUARIOS_VIEWER=correo@gmail.com`

---

## Errores comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `Token de Google inválido` | El Client ID del frontend no coincide con el del backend | Verificar que `GOOGLE_CLIENT_ID` en Heroku sea el mismo que en `main.jsx` |
| `Correo no autorizado` | El email no está en `USUARIOS_ADMIN` ni `USUARIOS_VIEWER` | Agregarlo a la variable de entorno correcta |
| `No autorizado` (401) | El frontend no está enviando el token en el header | Verificar `Authorization: Bearer ${getToken()}` en cada fetch |
| `Sesión expirada` | El JWT venció (duración: 12h) | El usuario debe hacer login de nuevo — o aumentar `timedelta(hours=12)` |
| El botón de Google no aparece | `GoogleOAuthProvider` no envuelve el componente | Verificar que `main.jsx` tenga el provider |
| Login funciona en local pero no en producción | Los orígenes autorizados en Google Cloud no incluyen la URL de producción | Agregar la URL de Heroku en la configuración OAuth de Google Cloud Console |
