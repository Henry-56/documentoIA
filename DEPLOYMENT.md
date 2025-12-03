# Guía de Despliegue - Documind AI

Guía completa para desplegar la aplicación RAG empresarial en un servidor de producción.

## 📋 Requisitos Previos

### Software Necesario
- **Node.js**: v18+ o v20+ (recomendado)
- **npm**: v9+ o yarn/pnpm
- **Servidor Web**: Nginx, Apache, o servicio de hosting moderno

### Servicios Externos
- **Cuenta de Google AI**: Para obtener API key de Gemini
  - Crear cuenta en: https://ai.google.dev/
  - Generar API key en Google AI Studio

---

## 🚀 Opción 1: Despliegue en Vercel (Recomendado para Inicio Rápido)

### Paso 1: Preparar el Repositorio
```bash
# Asegurarse de que todo esté commiteado
git add .
git commit -m "Preparado para producción"
git push origin main
```

### Paso 2: Configurar Vercel
1. Ir a [vercel.com](https://vercel.com)
2. Conectar repositorio de GitHub
3. Configurar variables de entorno:
   - `GEMINI_API_KEY`: Tu clave de API de Gemini

### Paso 3: Deploy Automático
- Vercel detectará automáticamente Vite y desplegará la aplicación
- URL pública disponible en minutos

### ⚠️ Advertencia de Seguridad
Con esta opción, la API key estará expuesta en el código del cliente. Para producción con alto tráfico, considera implementar un backend.

---

## 🚀 Opción 2: Despliegue en Netlify

### Paso 1: Build Settings
```bash
Build command: npm run build:prod
Publish directory: dist
```

### Paso 2: Variables de Entorno
En Netlify Dashboard → Site settings → Environment variables:
- `GEMINI_API_KEY`: Tu clave de API de Gemini

### Paso 3: Deploy
```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

---

## 🚀 Opción 3: Servidor VPS (Ubuntu/Linux)

### Paso 1: Preparar el Servidor

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalación
node --version
npm --version
```

### Paso 2: Instalar Nginx

```bash
# Instalar Nginx
sudo apt install -y nginx

# Verificar estado
sudo systemctl status nginx
```

### Paso 3: Preparar la Aplicación

```bash
# Clonar repositorio
cd /var/www
sudo git clone <tu-repositorio> documind-ai
cd documind-ai

# Instalar dependencias
sudo npm install

# Crear archivo de variables de entorno
sudo nano .env.production
```

**Contenido de `.env.production`:**
```env
GEMINI_API_KEY=tu_api_key_real_aqui
```

### Paso 4: Build de Producción

```bash
# Build optimizado para producción
sudo npm run build:prod

# Verificar que se creó la carpeta dist
ls -la dist/
```

### Paso 5: Configurar Nginx

```bash
# Crear configuración del sitio
sudo nano /etc/nginx/sites-available/documind-ai
```

**Contenido del archivo:**
```nginx
server {
    listen 80;
    server_name tu-dominio.com;  # Cambiar por tu dominio

    root /var/www/documind-ai/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cachear assets estáticos
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Comprimir respuestas
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

### Paso 6: Activar Sitio

```bash
# Crear enlace simbólico
sudo ln -s /etc/nginx/sites-available/documind-ai /etc/nginx/sites-enabled/

# Verificar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

### Paso 7: Configurar SSL (Opcional pero Recomendado)

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtener certificado SSL
sudo certbot --nginx -d tu-dominio.com

# Auto-renovación
sudo certbot renew --dry-run
```

---

## 🚀 Opción 4: Docker Container

### Paso 1: Crear Dockerfile

**Crear `Dockerfile` en la raíz del proyecto:**
```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Build de producción
RUN npm run build:prod

# Production stage
FROM nginx:alpine

# Copiar build al servidor web
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Paso 2: Crear nginx.conf

**Crear `nginx.conf`:**
```nginx
server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

### Paso 3: Build y Run con Docker

```bash
# Build de la imagen
docker build -t documind-ai .

# Correr el contenedor
docker run -d -p 80:80 \
  -e GEMINI_API_KEY=tu_api_key_aqui \
  --name documind-app \
  documind-ai

# Verificar logs
docker logs documind-app
```

### Paso 4: Docker Compose (Opcional)

**Crear `docker-compose.yml`:**
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "80:80"
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    restart: unless-stopped
```

**Correr con Docker Compose:**
```bash
# Crear archivo .env con GEMINI_API_KEY
echo "GEMINI_API_KEY=tu_api_key" > .env

# Iniciar
docker-compose up -d

# Ver logs
docker-compose logs -f
```

---

## 🔒 Consideraciones de Seguridad

### ⚠️ Problema: API Key Expuesta al Cliente

**Situación Actual:**
La clave de API de Gemini está incluida en el código JavaScript del cliente y puede ser extraída inspeccionando el código.

**Solución Recomendada para Producción:**
Implementar un backend que gestione las llamadas a la API de Gemini.

### Arquitectura Recomendada:

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│                 │      │                  │      │                 │
│  Cliente React  │─────▶│  Backend API     │─────▶│  Gemini API     │
│                 │      │  (Node/Express)  │      │                 │
└─────────────────┘      └──────────────────┘      └─────────────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │                  │
                         │  PostgreSQL +    │
                         │  pgvector        │
                         │                  │
                         └──────────────────┘
```

### Implementación de Backend (Opcional)

Si decides implementar un backend:
1. Crear servidor Express/NestJS
2. Mover lógica de `services/gemini.ts` al backend
3. Crear endpoints API protegidos
4. Cliente solo llama al backend, no directamente a Gemini

---

## ✅ Checklist de Verificación Pre-Despliegue

- [ ] Build de producción exitoso: `npm run build:prod`
- [ ] Variables de entorno configuradas
- [ ] API key de Gemini válida y con cuota disponible
- [ ] Prueba local con `npm run preview:prod`
- [ ] .gitignore incluye archivos sensibles (.env.local, .env.production)
- [ ] README actualizado con credenciales de demo
- [ ] Dominio configurado (si aplica)
- [ ] SSL configurado (si aplica)

---

## 🧪 Testing Post-Despliegue

### 1. Verificar Carga de la Aplicación
- Abrir URL en navegador
- Verificar que carga la pantalla de selección de rol

### 2. Probar Login Admin
- Email: `admin@test.com`
- Password: `admin`
- Verificar acceso al panel de administración

### 3. Probar Carga de Documentos
- Subir un archivo PDF de prueba
- Verificar que se procesa correctamente
- Confirmar que aparece en la lista de documentos

### 4. Probar Chat Cliente
- Crear cuenta de cliente o usar una existente
- Hacer pregunta sobre documento cargado
- Verificar respuesta del RAG con fuentes

### 5. Verificar Rendimiento
- Tiempo de carga inicial < 3 segundos
- Respuestas de chat < 5 segundos
- Sin errores en consola del navegador

---

## 🐛 Troubleshooting

### Error: "API Key de Gemini no encontrada"
**Solución:**
```bash
# Verificar que .env.production existe
cat .env.production

# Asegurarse de que la variable está definida
echo $GEMINI_API_KEY

# Rebuild con la variable correcta
npm run build:prod
```

### Error: "Cannot find module"
**Solución:**
```bash
# Limpiar node_modules
rm -rf node_modules package-lock.json

# Reinstalar dependencias
npm install

# Rebuild
npm run build:prod
```

### Error 404 al refrescar página
**Solución:**
El servidor web necesita configuración para SPA (Single Page Application).

**Nginx:**
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### Base de datos vacía después de despliegue
**Normal:** Dexie usa IndexedDB del navegador. Cada usuario tiene su propia base de datos local.

El usuario admin se crea automáticamente al primer acceso.

---

## 📊 Monitoreo y Mantenimiento

### Logs en Servidor VPS
```bash
# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Actualizar la Aplicación
```bash
# En el servidor
cd /var/www/documind-ai

# Pull últimos cambios
sudo git pull origin main

# Reinstalar dependencias si es necesario
sudo npm install

# Rebuild
sudo npm run build:prod

# Reiniciar Nginx
sudo systemctl restart nginx
```

### Backup de Base de Datos
**Nota:** La base de datos (IndexedDB) es del lado del cliente. Para backup de datos empresariales, considera migrar a PostgreSQL del lado del servidor.

---

## 📞 Soporte

Para problemas o preguntas:
- Revisar logs del navegador (F12 → Console)
- Revisar logs del servidor
- Verificar cuota de API de Gemini en Google AI Studio

---

## 🎯 Próximos Pasos Recomendados

1. **Implementar Backend API** (alta prioridad para producción)
2. **Migrar a PostgreSQL + pgvector** para base de datos del servidor
3. **Implementar autenticación JWT** real (actualmente es demo)
4. **Configurar analytics** (Google Analytics, Plausible, etc.)
5. **Implementar rate limiting** para prevenir abuso
6. **Configurar CDN** para mejor rendimiento global
7. **Implementar CI/CD** con GitHub Actions o GitLab CI

---

**¡La aplicación está lista para producción!** 🚀
