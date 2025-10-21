# Arquitectura SOLID para Lambdas

Este proyecto implementa una arquitectura SOLID optimizada para AWS Lambda, balanceando los principios de diseño con las restricciones de rendimiento de serverless.

## Estructura del Proyecto

```
src/
├── handlers/                    # Thin handlers (routing only)
│   ├── appointment-api.ts      # API Gateway handler
│   ├── appointment-pe-processor.ts
│   ├── appointment-cl-processor.ts
│   └── appointment-completed-processor.ts
│
├── services/                    # Business logic layer
│   ├── AppointmentService.ts   # Main appointment operations
│   ├── AppointmentProcessor.ts # Event processing logic
│   └── factories.ts            # Dependency injection factories
│
├── repositories/                # Data access layer
│   ├── AppointmentRepository.ts # DynamoDB operations
│   ├── EventRepository.ts      # SNS/EventBridge publishing
│   ├── RDSRepository.ts        # RDS operations
│   └── connections.ts          # Singleton AWS clients
│
├── domain/                      # Domain entities
│   └── Appointment.ts          # Appointment entity with validation
│
├── lambdas/                     # Legacy handlers (backward compatibility)
│   ├── appointment.ts          # → redirects to handlers/appointment-api.ts
│   ├── appointment-pe.ts       # → redirects to handlers/appointment-pe-processor.ts
│   ├── appointment-cl.ts       # → redirects to handlers/appointment-cl-processor.ts
│   └── appointment-completed.ts # → redirects to handlers/appointment-completed-processor.ts
│
└── utils/                       # Shared utilities
    ├── dynamodb.ts             # @deprecated - use repositories/AppointmentRepository
    ├── sns.ts                  # @deprecated - use repositories/EventRepository
    ├── eventbridge.ts          # @deprecated - use repositories/EventRepository
    └── rds.ts                  # @deprecated - use repositories/RDSRepository
```

## Principios SOLID Aplicados

### 1. Single Responsibility Principle (S)

Cada clase/módulo tiene una única razón para cambiar:

- **Handlers**: Solo routing y delegación a servicios
- **Services**: Lógica de negocio específica (crear appointments, procesar eventos)
- **Repositories**: Acceso a datos (DynamoDB, SNS, EventBridge, RDS)
- **Entities**: Validación y transformación de datos de dominio

**Ejemplo:**
```typescript
// handlers/appointment-api.ts - Solo routing
export const handler = withApiHandler(async (event, logger) => {
  const service = createAppointmentService(logger);
  if (method === 'POST') return handleCreate(event, service);
  if (method === 'GET') return handleGet(event, service);
});

// services/AppointmentService.ts - Solo lógica de negocio
class AppointmentService {
  async createAppointment(input) {
    const appointment = Appointment.create(input); // validación
    await this.appointmentRepo.save(appointment);  // persistencia
    await this.eventRepo.publishCreated(...);      // publicación
  }
}
```

### 2. Open/Closed Principle (O)

El código es abierto para extensión, cerrado para modificación:

- **Factories** permiten cambiar implementaciones sin tocar servicios
- **Strategy Pattern** en AppointmentProcessor (PE/CL processors)
- Nuevos procesadores de país se agregan sin modificar código existente

**Ejemplo:**
```typescript
// Agregar nuevo país sin modificar código existente
export function createMXAppointmentProcessor(logger: Logger) {
  return createAppointmentProcessor('MX', logger);
}
```

### 3. Liskov Substitution Principle (L)

No aplicado estrictamente por pragmatismo serverless - solo una implementación por repositorio.
Si en el futuro necesitas múltiples implementaciones (ej: DynamoDB vs Aurora), se pueden crear interfaces.

### 4. Interface Segregation Principle (I)

Repositorios específicos en lugar de uno genérico:

- `AppointmentRepository` - Solo operaciones de appointments
- `EventRepository` - Solo publicación de eventos
- `RDSRepository` - Solo persistencia RDS

### 5. Dependency Inversion Principle (D)

Servicios dependen de abstracciones (repositorios), no implementaciones concretas:

```typescript
// Service depende de repositorios (abstracciones)
class AppointmentService {
  constructor(
    private appointmentRepo: AppointmentRepository,  // ← abstracción
    private eventRepo: EventRepository,              // ← abstracción
    private logger: Logger
  ) {}
}

// Factory inyecta implementaciones concretas
function createAppointmentService(logger: Logger) {
  const appointmentRepo = new AppointmentRepository(getDynamoDBClient());
  const eventRepo = new EventRepository(getSNSClient(), getEventBridgeClient());
  return new AppointmentService(appointmentRepo, eventRepo, logger);
}
```

## Optimizaciones para Serverless

### 1. Singleton Connections

```typescript
// repositories/connections.ts
let dynamoDbClient: DynamoDBDocumentClient | null = null;

export function getDynamoDBClient() {
  if (!dynamoDbClient) {
    dynamoDbClient = DynamoDBDocumentClient.from(new DynamoDBClient());
  }
  return dynamoDbClient; // Reutilizado en invocaciones warm
}
```

**Beneficio**: Reduce cold start al reutilizar conexiones entre invocaciones

### 2. Dependency Injection Manual

```typescript
// Sin frameworks pesados (InversifyJS, TSyringe)
// Factory pattern simple y rápido
export function createAppointmentService(logger: Logger) {
  const repo = new AppointmentRepository(getDynamoDBClient());
  return new AppointmentService(repo, logger);
}
```

**Beneficio**: Zero overhead, bundle más pequeño, cold start más rápido

### 3. Thin Handlers

```typescript
// Handler mínimo - solo delegación
export const handler = withApiHandler(async (event, logger) => {
  const service = createAppointmentService(logger);
  return await service.createAppointment(parseBody(event.body));
});
```

**Beneficio**: Lógica testeable sin mockear AWS Lambda, fácil de mantener

## Flujo de Datos

### Crear Appointment (POST /appointments)

```
API Gateway
    ↓
handlers/appointment-api.ts (routing)
    ↓
services/AppointmentService.createAppointment() (business logic)
    ├→ domain/Appointment.create() (validation)
    ├→ repositories/AppointmentRepository.save() (persist to DynamoDB)
    └→ repositories/EventRepository.publishCreated() (publish to SNS)
```

### Procesar Evento (SQS → Lambda PE/CL)

```
SNS → SQS (filtered by country)
    ↓
handlers/appointment-pe-processor.ts
    ↓
services/AppointmentProcessor.processCreatedEvent() (business logic)
    ├→ repositories/RDSRepository.saveAppointment() (persist to RDS)
    └→ repositories/EventRepository.publishCompleted() (publish to EventBridge)
```

### Actualizar Estado (EventBridge → SQS → Lambda)

```
EventBridge → SQS
    ↓
handlers/appointment-completed-processor.ts
    ↓
repositories/AppointmentRepository.updateStatus() (update DynamoDB)
```

## Testing

La arquitectura facilita testing:

```typescript
// Unit test - mock repositories fácilmente
describe('AppointmentService', () => {
  it('should create appointment', async () => {
    const mockRepo = { save: jest.fn() };
    const mockEventRepo = { publishCreated: jest.fn() };
    const service = new AppointmentService(mockRepo, mockEventRepo, logger);

    await service.createAppointment(input);

    expect(mockRepo.save).toHaveBeenCalled();
    expect(mockEventRepo.publishCreated).toHaveBeenCalled();
  });
});
```

## Migración desde Código Legacy

Los archivos en `lambdas/` son wrappers que redirigen a la nueva arquitectura:

```typescript
// lambdas/appointment.ts
export { handler } from '../handlers/appointment-api';
```

**Archivos deprecated** (mantener por compatibilidad):
- `utils/dynamodb.ts` → usar `repositories/AppointmentRepository`
- `utils/sns.ts` → usar `repositories/EventRepository`
- `utils/eventbridge.ts` → usar `repositories/EventRepository`
- `utils/rds.ts` → usar `repositories/RDSRepository`

## Ventajas de esta Arquitectura

✅ **Testeable**: Fácil mockear dependencias sin AWS SDK
✅ **Mantenible**: Cambios localizados por separación de concerns
✅ **Escalable**: Agregar features sin modificar código existente
✅ **Performante**: Optimizado para serverless (singleton, no DI frameworks)
✅ **Type-safe**: TypeScript end-to-end
✅ **Flexible**: Cambiar implementaciones sin afectar lógica de negocio

## Próximos Pasos

1. **Tests**: Agregar unit tests para servicios y repositorios
2. **Interfaces**: Si surgen múltiples implementaciones, crear interfaces TypeScript
3. **Observability**: Integrar métricas y tracing (X-Ray)
4. **Validación**: Agregar schema validation (Zod, Joi) en capa de dominio
5. **Cleanup**: Eventual remoción de archivos deprecated cuando no haya dependencias
