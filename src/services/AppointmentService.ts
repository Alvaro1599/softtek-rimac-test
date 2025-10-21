import { Appointment } from '../domain/Appointment';
import { AppointmentRepository } from '../repositories/AppointmentRepository';
import { EventRepository } from '../repositories/EventRepository';
import { Logger } from '../utils/logger';
import { CreateAppointmentInput } from '../events/types';
import { MissingRequiredFieldError } from '../errors';

export class AppointmentService {
  constructor(
    private readonly appointmentRepo: AppointmentRepository,
    private readonly eventRepo: EventRepository,
    private readonly logger: Logger
  ) {}

  async createAppointment(input: CreateAppointmentInput) {
    this.logger.info('Creating new appointment', {
      insuredId: input.insuredId,
      countryISO: input.countryISO,
    });

    const appointment = Appointment.create(input);

    this.logger.info('Appointment entity created', {
      appointmentId: appointment.id,
      insuredId: appointment.insuredId,
      countryISO: appointment.countryISO,
    });

    await this.appointmentRepo.save(appointment);

    this.logger.info('Appointment saved to database', {
      appointmentId: appointment.id,
    });

    await this.eventRepo.publishCreated(appointment.toCreatedEvent());

    this.logger.info('Appointment created event published', {
      appointmentId: appointment.id,
    });

    return {
      message: 'Appointment request is being processed',
      appointmentId: appointment.id,
      status: appointment.status,
    };
  }

  async getAppointmentsByInsuredId(insuredId: string | undefined) {
    if (!insuredId) {
      throw new MissingRequiredFieldError(['insuredId']);
    }

    this.logger.info('Fetching appointments', { insuredId });

    const appointments = await this.appointmentRepo.findByInsuredId(insuredId);

    this.logger.info('Appointments retrieved', {
      insuredId,
      count: appointments.length,
    });

    return {
      insuredId,
      count: appointments.length,
      appointments: appointments.map((a) => a.toDTO()),
    };
  }

  async getAppointmentById(appointmentId: string | undefined) {
    if (!appointmentId) {
      throw new MissingRequiredFieldError(['appointmentId']);
    }

    this.logger.info('Fetching appointment by id', { appointmentId });

    const appointment =
        await this.appointmentRepo.findByIdOrFail(appointmentId);

    this.logger.info('Appointment retrieved', { appointmentId });

    return appointment.toDTO();
  }

}
