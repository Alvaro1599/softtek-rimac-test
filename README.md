# Medical Appointment System

Sistema de agendamiento de citas médicas desarrollado con arquitectura serverless en AWS. El sistema permite gestionar citas médicas para múltiples países (Perú y Chile) utilizando servicios nativos de AWS para procesamiento asíncrono y almacenamiento distribuido.

## 📑 Tabla de Contenidos

- [Inicio Rápido](#inicio-rápido)
- [Arquitectura](#arquitectura)
- [Prerequisitos](#prerequisitos)
- [Documentación de la API](#documentación-de-la-api)
  - [URLs de Acceso](#urls-de-acceso)
  - [Swagger UI Interactivo](#swagger-ui-interactivo)
- [API Endpoints](#api-endpoints)
- [Desarrollo y Testing](#desarrollo-y-testing)
- [Despliegue](#despliegue)
  - [Despliegue del Backend](#despliegue-en-aws)
  - [Despliegue del Frontend](#despliegue-del-frontend)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Stack Tecnológico](#stack-tecnológico)
- [Solución de Problemas](#solución-de-problemas)

## Arquitectura

El sistema implementa una arquitectura basada en eventos utilizando los siguientes componentes de AWS:

- **API Gateway HTTP**: Endpoints REST para gestión de citas
- **AWS Lambda**: Funciones serverless para procesamiento de lógica de negocio
- **DynamoDB**: Base de datos NoSQL para almacenamiento de citas
- **SNS (Simple Notification Service)**: Publicación de eventos de citas
- **SQS (Simple Queue Service)**: Colas dedicadas por país (PE, CL) y estado (completed)
- **EventBridge**: Bus de eventos para flujos asíncronos
- **S3**: Almacenamiento y hosting del frontend web

### Flujo de Procesamiento

1. Cliente crea una cita mediante API Gateway
2. Lambda principal valida y guarda en DynamoDB
3. Evento publicado a SNS con filtro por país
4. SQS recibe mensaje filtrado según país (PE o CL)
5. Lambda específica de país procesa la cita
6. EventBridge emite evento de completado
7. Lambda de completado actualiza estado final

## Inicio Rápido

### Ver la Aplicación Web (Local)

```bash
# 1. Clonar el repositorio
git clone <repository-url>
cd softek-rimac

# 2. Abrir la aplicación en el navegador
open web/index.html

# O usar un servidor web simple
cd web && python3 -m http.server 8000
# Navegar a: http://localhost:8000
```

### Ver la Documentación Swagger (Local)

```bash
# Abrir directamente
open web/api-docs.html

# O con servidor web
cd web && python3 -m http.server 8000
# Navegar a: http://localhost:8000/api-docs.html
```

### Desplegar Todo (Backend + Frontend)

```bash
# 1. Instalar dependencias
pnpm install

# 2. Desplegar backend a AWS
pnpm deploy
# ⚠️ IMPORTANTE: Copia la URL del API Gateway que aparece en la salida

# 3. Configurar bucket S3 en package.json
# Edita el script "prepare:web" y reemplaza "softtek-rimac-page"
# por el nombre de tu bucket S3

# 4. Actualizar API_BASE_URL en web/js/config.js
# Pega la URL del API Gateway copiada en el paso 2

# 5. Desplegar frontend a S3
pnpm run prepare:web

# 6. (OPCIONAL) Si usas CloudFront, invalidar el cache
aws cloudfront create-invalidation \
  --distribution-id TU-DISTRIBUTION-ID \
  --paths "/*"

# 7. Acceder a:
# - Frontend: http://softtek-rimac-page.s3-website-us-east-1.amazonaws.com
# - API Docs: http://softtek-rimac-page.s3-website-us-east-1.amazonaws.com/api-docs.html
```

**⚠️ Checklist Pre-Deployment:**
- [ ] AWS CLI configurado con credenciales válidas
- [ ] Bucket S3 creado con website hosting habilitado
- [ ] Nombre del bucket actualizado en `package.json`
- [ ] Permisos S3 configurados (PutObject, DeleteObject, ListBucket)
- [ ] (Opcional) CloudFront distribution creada y configurada

## Prerequisitos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js**: Versión 20.x o superior
- **pnpm**: Versión 10.7.1 o superior
  ```bash
  npm install -g pnpm
  ```
- **AWS CLI**: Configurado con credenciales válidas
  ```bash
  aws configure
  ```
- **Serverless Framework**: Versión 4.x
  ```bash
  npm install -g serverless
  ```

## Configuración Inicial

### 1. Clonar el Repositorio

```bash
git clone <repository-url>
cd softek-rimac
```

### 2. Instalar Dependencias

```bash
pnpm install
```

### 3. Configurar Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
# Configuración RDS para Perú (Mock - No implementado completamente)
RDS_PE_HOST=localhost
RDS_PE_PORT=3306
RDS_PE_USER=admin
RDS_PE_PASSWORD=password123
RDS_PE_DATABASE=appointments_pe

# Configuración RDS para Chile (Mock - No implementado completamente)
RDS_CL_HOST=localhost
RDS_CL_PORT=3306
RDS_CL_USER=admin
RDS_CL_PASSWORD=password123
RDS_CL_DATABASE=appointments_cl
```

**Nota**: Las variables de RDS son configuración placeholder. El sistema actualmente utiliza DynamoDB como almacenamiento principal. La integración con RDS no está completamente implementada.

## Desarrollo y Testing

### Ejecutar Pruebas

El proyecto utiliza Jest para pruebas unitarias con cobertura configurada al 80%.

```bash
# Ejecutar todas las pruebas
pnpm test

# Ejecutar con reporte de cobertura
pnpm test:coverage

# Modo watch para desarrollo
pnpm test:watch

# Modo verbose para más detalles
pnpm test:verbose
```

### Estructura de Testing

- Cobertura mínima: 80% (branches, functions, lines, statements)
- Ubicación de tests: `src/__tests__/unit/`
- Configuración: `jest.config.js`

## Despliegue

### Despliegue en AWS

El sistema se despliega completamente en AWS utilizando Serverless Framework.

#### Despliegue en Desarrollo

```bash
pnpm deploy
```

#### Despliegue en Producción

```bash
serverless deploy --stage prod --region us-east-1
```

#### Eliminar Recursos

```bash
pnpm remove
```

### Recursos Creados en AWS

El despliegue crea automáticamente:

1. **DynamoDB Table**: `medical-appointment-system-appointments-{stage}`
   - Partition Key: `appointmentId`
   - GSI: `InsuredIdIndex` (por `insuredId`)

2. **Lambda Functions**:
   - `appointment`: API principal de citas
   - `health`: Health check del sistema
   - `appointmentPE`: Procesador de citas Perú
   - `appointmentCL`: Procesador de citas Chile
   - `appointmentCompleted`: Procesador de citas completadas

3. **SNS Topic**: `medical-appointment-system-topic-{stage}`
   - Subscriptions filtradas por país (PE, CL)

4. **SQS Queues**:
   - `medical-appointment-system-sqs-pe-{stage}`
   - `medical-appointment-system-sqs-cl-{stage}`
   - `medical-appointment-system-sqs-completed-{stage}`

5. **EventBridge Event Bus**: `medical-appointment-system-events-{stage}`
   - Rule para eventos `appointment.completed`

## Documentación de la API

### Swagger UI Interactivo

El proyecto incluye documentación interactiva de la API usando **Swagger UI** y **OpenAPI 3.0**:

- **Documentación Web**: Accesible desde el botón "API Docs" en el frontend
- **Especificación OpenAPI**: Archivo `web/openapi.yaml` con definición completa de la API
- **Try it Out**: Permite probar los endpoints directamente desde el navegador

#### URLs de Acceso

##### Aplicación Web (Frontend)
```
Producción:  http://softtek-rimac-page.s3-website-us-east-1.amazonaws.com/
Local:       Abrir web/index.html en el navegador

Páginas disponibles:
├── /index.html              # Página principal - Agendar citas
├── /my-appointments.html    # Consultar mis citas
└── /api-docs.html          # Documentación Swagger UI
```

##### Documentación Swagger
```
Swagger UI:      http://softtek-rimac-page.s3-website-us-east-1.amazonaws.com/api-docs.html
OpenAPI YAML:    http://softtek-rimac-page.s3-website-us-east-1.amazonaws.com/openapi.yaml
Local Swagger:   Abrir web/api-docs.html en el navegador
Local YAML:      web/openapi.yaml
```

##### API Endpoints (Backend)
```
Base URL Dev:  https://nlhic74tlk.execute-api.us-east-1.amazonaws.com

Endpoints disponibles:
├── GET  /health                              # Health check
├── POST /appointments                        # Crear cita
├── GET  /insured/{insuredId}/appointments   # Citas por asegurado
└── GET  /appointments/{appointmentId}       # Detalle de cita
```

**Nota**: El `{api-id}` se genera automáticamente al desplegar con `pnpm deploy` y se mostrará en la salida del comando.

#### Acceder a la Documentación

2. **Dev**:
   - URL directa: `http://softtek-rimac-page.s3-website-us-east-1.amazonaws.com/api-docs.html`
   - Desde la app: Click en el botón "📚 API Docs" en la navegación superior

3. **Desde Frontend**: Click en el botón "API Docs" en cualquier página

#### Características de la Documentación

- ✅ Especificación completa OpenAPI 3.0
- ✅ Ejemplos de request/response para cada endpoint
- ✅ Esquemas de datos con validaciones
- ✅ Códigos de error documentados
- ✅ Interfaz interactiva para probar endpoints
- ✅ Descarga del archivo OpenAPI YAML
- ✅ Integración con el diseño del sitio
- ✅ Selector de servidor (producción/local)
- ✅ Diseño responsive para mobile

## API Endpoints

Una vez desplegado, el sistema expone los siguientes endpoints:

### POST /appointments
Crear nueva cita médica

**Request Body**:
```json
{
  "insuredId": "string",
  "countryISO": "PE" | "CL",
  "specialty": "string",
  "date": "YYYY-MM-DD",
  "time": "HH:mm"
}
```

**Response**:
```json
{
  "appointmentId": "string",
  "status": "pending",
  "insuredId": "string",
  "countryISO": "string",
  "specialty": "string",
  "appointmentDate": "ISO-8601",
  "createdAt": "ISO-8601"
}
```

### GET /insured/{insuredId}/appointments
Obtener todas las citas de un asegurado

**Response**:
```json
{
  "appointments": [
    {
      "appointmentId": "string",
      "status": "pending" | "confirmed" | "completed",
      "specialty": "string",
      "appointmentDate": "ISO-8601"
    }
  ]
}
```

### GET /appointments/{appointmentId}
Obtener detalle de una cita específica

**Response**:
```json
{
  "appointmentId": "string",
  "insuredId": "string",
  "status": "string",
  "specialty": "string",
  "countryISO": "string",
  "appointmentDate": "ISO-8601",
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601"
}
```

### GET /health
Health check del sistema

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "ISO-8601"
}
```

## Despliegue del Frontend

El frontend está ubicado en el directorio `web/` y se despliega en S3 como sitio web estático.

### Prerequisitos

1. **Bucket S3 creado y configurado**:
   - Nombre del bucket (por defecto): `softtek-rimac-page`
   - Website hosting habilitado
   - Permisos de lectura pública configurados

2. **AWS CLI configurado** con permisos para:
   - `s3:PutObject`
   - `s3:DeleteObject`
   - `s3:ListBucket`
   - `s3:GetObject`

3. **(Opcional) CloudFront** para CDN y HTTPS:
   - Distribución creada apuntando al bucket S3
   - Permisos para invalidación de cache

### Configuración del Bucket S3

**IMPORTANTE**: El nombre del bucket está configurado manualmente en `package.json`.

Para cambiar el bucket de destino, edita el script `prepare:web` en `package.json`:

```json
{
  "scripts": {
    "prepare:web": "aws s3 sync web/ s3://TU-BUCKET-AQUI/ --delete ..."
  }
}
```

Reemplaza `softtek-rimac-page` por el nombre de tu bucket en **ambas** ocurrencias del comando.

### Desplegar Frontend

```bash
pnpm run prepare:web
```

Este comando ejecuta dos sincronizaciones en S3:

1. **Archivos estáticos** (JS, CSS, imágenes): Cache de 1 año
   - `--cache-control 'max-age=31536000,public'`
   - Excluye HTML y YAML

2. **Archivos dinámicos** (HTML, YAML): Sin cache
   - `--cache-control 'no-cache'`
   - Incluye: `*.html`, `*.yaml`

Archivos desplegados:
```
web/
├── index.html              → Agendar citas
├── my-appointments.html    → Consultar citas
├── api-docs.html          → Documentación Swagger
├── openapi.yaml           → Especificación OpenAPI
└── js/
    ├── config.js          → Configuración de la app
    ├── mock-data.js       → Datos de prueba
    └── api-client.js      → Cliente HTTP para la API
```

### Invalidación de CloudFront (Opcional)

Si tienes una distribución de CloudFront configurada, **debes invalidar el cache** después de desplegar para que los cambios sean visibles inmediatamente:

```bash
# Invalidar todos los archivos
aws cloudfront create-invalidation \
  --distribution-id TU-DISTRIBUTION-ID \
  --paths "/*"

# Invalidar solo archivos específicos (más eficiente)
aws cloudfront create-invalidation \
  --distribution-id TU-DISTRIBUTION-ID \
  --paths "/index.html" "/my-appointments.html" "/api-docs.html" "/openapi.yaml"
```

Para obtener tu `DISTRIBUTION-ID`:
```bash
aws cloudfront list-distributions --query 'DistributionList.Items[*].[Id,DomainName]' --output table
```

**Nota**:
- Sin invalidación, CloudFront puede servir versión cacheada hasta 24 horas
- Las invalidaciones son gratuitas hasta 1,000 paths por mes
- El proceso de invalidación toma 1-5 minutos

### Acceso al Frontend

Una vez desplegado, el frontend estará disponible en:

**URL Principal (S3 Website)**:
```
http://softtek-rimac-page.s3-website-us-east-1.amazonaws.com
```

**Páginas Disponibles**:
- `/` o `/index.html` - Página principal (Agendar cita)
- `/my-appointments.html` - Consultar mis citas
- `/api-docs.html` - Documentación de la API (Swagger UI)
- `/openapi.yaml` - Especificación OpenAPI (descargable)

**CloudFront (opcional)**: Si tienes CloudFront configurado, las URLs serán:
```
https://d1234567890abc.cloudfront.net/
https://your-custom-domain.com/  (si tienes dominio personalizado)
```

### Configuración del API Base URL

El frontend necesita conocer la URL de la API backend para funcionar correctamente.

#### Obtener la URL de la API

Después de desplegar el backend con `pnpm deploy`, la salida del comando mostrará:

```bash
endpoints:
  GET - https://abc123xyz.execute-api.us-east-1.amazonaws.com/health
  POST - https://abc123xyz.execute-api.us-east-1.amazonaws.com/appointments
  GET - https://abc123xyz.execute-api.us-east-1.amazonaws.com/insured/{insuredId}/appointments
  GET - https://abc123xyz.execute-api.us-east-1.amazonaws.com/appointments/{appointmentId}
```

Copia la URL base (sin el path): `https://abc123xyz.execute-api.us-east-1.amazonaws.com`

#### Configurar el Frontend

Edita `web/js/config.js` y actualiza la configuración:

```javascript
const CONFIG = {
  // Local development
  local: 'http://localhost:3000',

  // Development environment - ACTUALIZAR ESTA URL
  dev: 'https://abc123xyz.execute-api.us-east-1.amazonaws.com',

  // Production environment
  prod: 'https://your-prod-api-id.execute-api.us-east-1.amazonaws.com'
};

// Cambiar el ambiente según necesites
const ENVIRONMENT = 'dev';  // Opciones: 'local', 'dev', 'prod'
```

Después de actualizar, vuelve a desplegar el frontend:

```bash
pnpm run prepare:web
```

## Estructura del Proyecto

```
softek-rimac/
├── src/
│   ├── lambdas/              # Handlers de Lambda
│   │   ├── appointment.ts
│   │   ├── appointment-pe.ts
│   │   ├── appointment-cl.ts
│   │   ├── appointment-completed.ts
│   │   ├── schedule.ts
│   │   └── health.ts
│   ├── handlers/             # Lógica de procesamiento
│   │   ├── appointment-api.ts
│   │   ├── appointment-pe-processor.ts
│   │   ├── appointment-cl-processor.ts
│   │   ├── appointment-completed-processor.ts
│   │   ├── schedule-api.ts
│   │   └── health.ts
│   ├── services/             # Capa de servicios
│   │   ├── AppointmentService.ts
│   │   ├── AppointmentProcessor.ts
│   │   ├── ScheduleService.ts
│   │   └── factories.ts
│   ├── repositories/         # Acceso a datos
│   │   ├── AppointmentRepository.ts
│   │   ├── EventRepository.ts
│   │   ├── RDSRepository.ts
│   │   └── connections.ts
│   ├── domain/               # Modelos de dominio
│   │   └── Appointment.ts
│   ├── events/               # Tipos de eventos
│   │   └── types.ts
│   ├── utils/                # Utilidades
│   │   ├── validators.ts
│   │   ├── response.ts
│   │   ├── logger.ts
│   │   └── lambda-wrapper.ts
│   ├── errors/               # Manejo de errores
│   │   └── index.ts
│   ├── types/                # Definiciones TypeScript
│   │   └── index.ts
│   └── __tests__/            # Pruebas unitarias
│       └── unit/
├── web/                      # Frontend estático
│   ├── index.html
│   ├── my-appointments.html
│   ├── api-docs.html
│   ├── openapi.yaml
│   └── js/
├── coverage/                 # Reportes de cobertura
├── .serverless/             # Artefactos de despliegue
├── serverless.yml           # Configuración de infraestructura
├── tsconfig.json            # Configuración TypeScript
├── jest.config.js           # Configuración de pruebas
├── package.json             # Dependencias y scripts
└── .env                     # Variables de entorno (no versionado)
```

## Stack Tecnológico

### Backend
- **Runtime**: Node.js 20.x
- **Lenguaje**: TypeScript 5.9
- **Framework**: Serverless Framework 4.x
- **Build**: esbuild (nativo en Serverless v4)
- **Testing**: Jest 30.x con ts-jest
- **AWS SDK**: v3 (modular)
  - @aws-sdk/client-dynamodb
  - @aws-sdk/client-eventbridge
  - @aws-sdk/client-sns
  - @aws-sdk/client-sqs
  - @aws-sdk/lib-dynamodb

### Base de Datos
- **Principal**: DynamoDB (serverless, pay-per-request)
- **Placeholder**: MySQL2 (configurado pero no implementado)

### Frontend
- **Tecnología**: HTML5, CSS3, JavaScript Vanilla
- **Hosting**: AWS S3 Static Website

### Infraestructura
- **IaC**: Serverless Framework + CloudFormation
- **Región**: us-east-1 (configurable)
- **Compute**: AWS Lambda
- **API**: API Gateway HTTP API
- **Messaging**: SNS + SQS
- **Events**: EventBridge

## Scripts Disponibles

```json
{
  "start": "Desarrollo local (no configurado)",
  "deploy": "Desplegar a AWS",
  "remove": "Eliminar recursos de AWS",
  "test": "Ejecutar pruebas unitarias",
  "test:watch": "Pruebas en modo watch",
  "test:coverage": "Pruebas con reporte de cobertura",
  "test:verbose": "Pruebas con salida detallada",
  "prepare:web": "Desplegar frontend a S3"
}
```

## Configuración de AWS

### Permisos Necesarios

El usuario de AWS CLI debe tener permisos para:
- CloudFormation (crear/actualizar stacks)
- Lambda (crear/actualizar funciones)
- API Gateway (crear/gestionar APIs)
- DynamoDB (crear tablas e índices)
- SNS (crear topics y subscriptions)
- SQS (crear colas y políticas)
- EventBridge (crear buses y rules)
- IAM (crear roles y políticas)
- S3 (crear buckets y subir objetos)
- CloudWatch Logs (crear log groups)

## Solución de Problemas

### Error: "Cannot find module"
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Error de permisos en AWS
Verificar configuración de AWS CLI:
```bash
aws sts get-caller-identity
```

### Tests fallando
Limpiar cache de Jest:
```bash
pnpm test --clearCache
pnpm test
```

### Despliegue de Backend fallido
Ver logs detallados:
```bash
serverless deploy --verbose
```

### Problemas con Despliegue del Frontend

#### Error: "NoSuchBucket"
El bucket S3 especificado no existe o el nombre está mal configurado.

**Solución**:
```bash
# Verificar que el bucket existe
aws s3 ls | grep softtek-rimac-page

# Si no existe, crearlo
aws s3 mb s3://softtek-rimac-page --region us-east-1

# Habilitar website hosting
aws s3 website s3://softtek-rimac-page/ \
  --index-document index.html \
  --error-document index.html
```

#### Error: "AccessDenied" al ejecutar prepare:web
El usuario de AWS CLI no tiene permisos suficientes.

**Solución**: Verificar permisos IAM:
```bash
# Verificar identidad actual
aws sts get-caller-identity

# El usuario/role necesita estos permisos:
# - s3:PutObject
# - s3:DeleteObject
# - s3:ListBucket
# - s3:GetObject
```

#### Los cambios no se ven en el sitio web

**Posibles causas**:

1. **Cache del navegador**:
   ```bash
   # Abrir en modo incógnito o limpiar cache del navegador
   # Chrome: Cmd+Shift+Delete (Mac) / Ctrl+Shift+Delete (Windows)
   ```

2. **Cache de CloudFront** (si está configurado):
   ```bash
   # Invalidar cache de CloudFront
   aws cloudfront create-invalidation \
     --distribution-id TU-DISTRIBUTION-ID \
     --paths "/*"
   ```

3. **Bucket policy no permite lectura pública**:
   ```bash
   # Configurar bucket policy para lectura pública
   aws s3api put-bucket-policy --bucket softtek-rimac-page --policy '{
     "Version": "2012-10-17",
     "Statement": [{
       "Sid": "PublicReadGetObject",
       "Effect": "Allow",
       "Principal": "*",
       "Action": "s3:GetObject",
       "Resource": "arn:aws:s3:::softtek-rimac-page/*"
     }]
   }'
   ```

#### Error 404 al acceder a la documentación

Si `api-docs.html` retorna 404:

**Solución**:
```bash
# Verificar que el archivo fue subido
aws s3 ls s3://softtek-rimac-page/ --recursive | grep api-docs

# Si no está, volver a desplegar
pnpm run prepare:web
```
