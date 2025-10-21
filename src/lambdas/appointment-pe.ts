/**
 * Legacy handler - redirects to new SOLID architecture
 * Maintained for backward compatibility with existing infrastructure
 *
 * New implementation can be found in:
 * - handlers/appointment-pe-processor.ts (handler)
 * - services/AppointmentProcessor.ts (business logic)
 * - repositories/RDSRepository.ts (data access)
 * - repositories/EventRepository.ts (event publishing)
 */

export { handler } from '../handlers/appointment-pe-processor';
