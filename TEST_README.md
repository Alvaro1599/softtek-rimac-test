# Tests Unitarios - Softek Rimac

Este proyecto cuenta con una suite completa de tests unitarios utilizando **Jest** y **TypeScript**.

## Resumen de Cobertura

### Componentes con 100% de Cobertura

- **Domain Layer**
  - `Appointment.ts` - Entidad de dominio con validaciones

- **Service Layer**
  - `AppointmentService.ts` - Lógica de negocio para crear y consultar citas
  - `AppointmentProcessor.ts` - Procesamiento de eventos por país

- **Repository Layer**
  - `AppointmentRepository.ts` - Operaciones de DynamoDB

- **Utils**
  - `validators.ts` - Todas las funciones de validación

- **Errors**
  - Todas las clases de error personalizadas

### Estadísticas Generales

- **Total de tests**: 142 tests
- **Test Suites**: 6 archivos de test
- **Estado**: Todos los tests pasan ✓

## Comandos Disponibles

### Ejecutar todos los tests
```bash
pnpm test
```

### Ejecutar tests en modo watch (desarrollo)
```bash
pnpm test:watch
```

### Generar reporte de cobertura
```bash
pnpm test:coverage
```

### Ejecutar tests con información detallada
```bash
pnpm test:verbose
```

## Estructura de Tests

```
src/
└── __tests__/
    └── unit/
        ├── domain/
        │   └── Appointment.test.ts          (15 tests)
        ├── services/
        │   ├── AppointmentService.test.ts   (15 tests)
        │   └── AppointmentProcessor.test.ts (12 tests)
        ├── repositories/
        │   └── AppointmentRepository.test.ts (21 tests)
        ├── utils/
        │   └── validators.test.ts           (46 tests)
        └── errors/
            └── errors.test.ts               (33 tests)
```

## Detalles de los Tests

### Domain - Appointment.test.ts
Tests de la entidad de dominio:
- Creación de appointments con validaciones
- Transformaciones (toRecord, toDTO, toCreatedEvent, toCompletedEvent)
- Validaciones de insuredId, scheduleId y countryISO
- Manejo de errores de validación

### Services - AppointmentService.test.ts
Tests del servicio de negocio:
- Crear appointments para PE y CL
- Consultar appointments por insuredId
- Logging de operaciones
- Manejo de errores en repositorio y eventos

### Services - AppointmentProcessor.test.ts
Tests del procesador de eventos:
- Procesamiento de eventos por país (PE/CL)
- Validación de country mismatch
- Guardado en RDS y publicación de eventos
- Logging con tags por país
- Manejo de errores

### Repositories - AppointmentRepository.test.ts
Tests del repositorio DynamoDB:
- CRUD operations (save, findById, findByIdOrFail, findByInsuredId)
- Update de status
- Validación de existencia
- Manejo de errores de DynamoDB
- Uso correcto de Commands (PutCommand, GetCommand, QueryCommand, UpdateCommand)

### Utils - validators.test.ts
Tests de todas las funciones de validación:
- validateRequired
- validateCountryISO
- validateInsuredId
- validatePositiveNumber
- validateUUID
- parseBody
- validateEmail
- validateMaxLength
- validateMinLength
- validateEnum

### Errors - errors.test.ts
Tests de todas las clases de error:
- AppError base class
- ValidationError, NotFoundError, ConflictError
- UnauthorizedError, ForbiddenError, InternalError
- ServiceUnavailableError, MethodNotAllowedError
- Errores específicos del dominio (InvalidCountryCodeError, InvalidInsuredIdError, etc.)
- Función isOperationalError

## Configuración

### jest.config.js
- Preset: `ts-jest`
- Test environment: `node`
- Test match: `**/__tests__/**/*.test.ts`
- Coverage threshold: 80% (global)
- Exclusiones: lambdas, handlers, types

### Mocking Strategy

Los tests utilizan mocks de Jest para:
- **DynamoDBDocumentClient**: Mock completo del cliente de DynamoDB
- **Repositories**: Mocks de repositorios en tests de servicios
- **Logger**: Mock del logger para verificar logs

## Best Practices Implementadas

1. **Arrange-Act-Assert**: Estructura clara en todos los tests
2. **Isolation**: Cada test es independiente
3. **Descriptive Names**: Nombres descriptivos que explican qué se testea
4. **Edge Cases**: Tests de casos límite y errores
5. **Mock Reset**: Limpieza de mocks en `afterEach`
6. **Type Safety**: TypeScript en todos los tests

## Próximos Pasos

Para aumentar la cobertura global al 80%+ se podrían agregar:
- Tests para los handlers (lambdas wrappers)
- Tests para utilities (logger, response, lambda-wrapper)
- Tests de integración para los flujos completos
- Tests end-to-end con LocalStack
