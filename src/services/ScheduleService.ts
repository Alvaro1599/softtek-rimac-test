import { Logger } from '../utils/logger';
import { MissingRequiredFieldError } from '../errors';

interface ScheduleSlot {
  scheduleId: number;
  date: string;
  time: string;
  specialtyId: number;
  specialtyName: string;
  doctorName: string;
  medicalCenter: string;
  countryISO: 'PE' | 'CL';
  available: boolean;
}

export class ScheduleService {
  constructor(private readonly logger: Logger) {}

  async getAvailableSchedules(
    countryISO: string | undefined,
    date?: string,
    specialtyId?: string
  ): Promise<{ count: number; schedules: ScheduleSlot[] }> {
    if (!countryISO) {
      throw new MissingRequiredFieldError(['countryISO']);
    }

    if (countryISO !== 'PE' && countryISO !== 'CL') {
      throw new Error('Invalid countryISO. Must be PE or CL');
    }

    this.logger.info('Fetching available schedules', {
      countryISO,
      date,
      specialtyId,
    });

    // Mock data
    const mockSchedules = this.generateMockSchedules(
      countryISO as 'PE' | 'CL',
      date,
      specialtyId ? parseInt(specialtyId) : undefined
    );

    this.logger.info('Schedules retrieved', {
      count: mockSchedules.length,
    });

    return {
      count: mockSchedules.length,
      schedules: mockSchedules,
    };
  }

  private generateMockSchedules(
    countryISO: 'PE' | 'CL',
    date?: string,
    specialtyId?: number
  ): ScheduleSlot[] {
    const targetDate = date || new Date().toISOString().split('T')[0];

    const specialties = [
      { id: 1, name: 'Cardiología' },
      { id: 2, name: 'Pediatría' },
      { id: 3, name: 'Dermatología' },
      { id: 4, name: 'Oftalmología' },
      { id: 5, name: 'Traumatología' },
    ];

    const doctors = {
      PE: [
        'Dr. Carlos Mendoza',
        'Dra. Ana Gonzales',
        'Dr. Luis Pérez',
        'Dra. María Torres',
      ],
      CL: [
        'Dr. Jorge Silva',
        'Dra. Carmen López',
        'Dr. Pablo Vargas',
        'Dra. Isabel Rojas',
      ],
    };

    const centers = {
      PE: ['Clínica Lima', 'Hospital Arequipa', 'Centro Médico Cusco'],
      CL: ['Clínica Las Condes', 'Hospital Santiago', 'Centro Médico Viña'],
    };

    const times = [
      '08:00',
      '09:00',
      '10:00',
      '11:00',
      '14:00',
      '15:00',
      '16:00',
      '17:00',
    ];

    const schedules: ScheduleSlot[] = [];
    let scheduleIdCounter = 1000;

    // Filter specialties if specialtyId is provided
    const filteredSpecialties = specialtyId
      ? specialties.filter((s) => s.id === specialtyId)
      : specialties;

    filteredSpecialties.forEach((specialty) => {
      times.forEach((time, index) => {
        schedules.push({
          scheduleId: scheduleIdCounter++,
          date: targetDate,
          time,
          specialtyId: specialty.id,
          specialtyName: specialty.name,
          doctorName: doctors[countryISO][index % doctors[countryISO].length],
          medicalCenter: centers[countryISO][index % centers[countryISO].length],
          countryISO,
          available: Math.random() > 0.3, // 70% available
        });
      });
    });

    return schedules.filter((s) => s.available);
  }
}
