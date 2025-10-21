import { RDSRepository } from '../repositories/RDSRepository';
import { EventRepository } from '../repositories/EventRepository';
import { Logger } from '../utils/logger';
import { EventPayload } from '../events/types';

export class AppointmentProcessor {
  constructor(
    private readonly country: 'PE' | 'CL',
    private readonly rdsRepo: RDSRepository,
    private readonly eventRepo: EventRepository,
    private readonly logger: Logger
  ) {}

  async processCreatedEvent(event: EventPayload<'appointment.created'>): Promise<void> {
    const countryTag = `[${this.country}]`;

    this.logger.info(`${countryTag} Processing appointment`, {
      appointmentId: event.appointmentId,
      insuredId: event.insuredId,
      countryISO: event.countryISO,
    });

    // Validate that event is for this country
    if (event.countryISO !== this.country) {
      this.logger.warn(`${countryTag} Event country mismatch`, {
        expected: this.country,
        received: event.countryISO,
        appointmentId: event.appointmentId,
      });
      // Could throw error or skip processing depending on business requirements
      return;
    }

    // Save to country-specific RDS
    await this.rdsRepo.saveAppointment(event);

    this.logger.info(`${countryTag} Appointment saved to RDS`, {
      appointmentId: event.appointmentId,
    });

    const completedEvent: EventPayload<'appointment.completed'> = {
      appointmentId: event.appointmentId,
      insuredId: event.insuredId,
      scheduleId: event.scheduleId,
      countryISO: event.countryISO,
      timestamp: new Date().toISOString(),
    };

    await this.eventRepo.publishCompleted(completedEvent);

    this.logger.info(`${countryTag} Completion event published`, {
      appointmentId: event.appointmentId,
    });
  }

}
