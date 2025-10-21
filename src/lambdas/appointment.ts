/**
 * Legacy handler - redirects to new SOLID architecture
 * Maintained for backward compatibility with existing infrastructure
 *
 * New implementation can be found in:
 * - handlers/appointment-api.ts (handler)
 * - services/AppointmentService.ts (business logic)
 * - repositories/AppointmentRepository.ts (data access)
 * - repositories/EventRepository.ts (event publishing)
 */

export { handler } from '../handlers/appointment-api';
