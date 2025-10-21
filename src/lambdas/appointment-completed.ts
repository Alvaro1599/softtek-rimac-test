/**
 * Legacy handler - redirects to new SOLID architecture
 * Maintained for backward compatibility with existing infrastructure
 *
 * New implementation can be found in:
 * - handlers/appointment-completed-processor.ts (handler)
 * - repositories/AppointmentRepository.ts (data access)
 */

export { handler } from '../handlers/appointment-completed-processor';
