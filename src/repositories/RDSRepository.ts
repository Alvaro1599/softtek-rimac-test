import { EventPayload } from '../events/types';

export class RDSRepository {
  constructor(private readonly country: 'PE' | 'CL') {}

  async saveAppointment(appointment: EventPayload<'appointment.created'>): Promise<void> {
    const dbConfig = this.getDBConfig();

    console.log(`[RDS ${this.country}] Simulando guardado en base de datos:`, {
      config: { ...dbConfig, password: '***' },
      appointment,
    });

    // const connection = await mysql.createConnection(dbConfig);
    // await connection.execute(
    //   'INSERT INTO appointments (id, insured_id, schedule_id, country_iso, created_at) VALUES (?, ?, ?, ?, ?)',
    //   [appointment.appointmentId, appointment.insuredId, appointment.scheduleId, appointment.countryISO, new Date()]
    // );
    // await connection.end();

    // Simulate database delay
    await this.simulateDelay(100);
  }

  private getDBConfig() {
    if (this.country === 'PE') {
      return {
        host: process.env.RDS_PE_HOST,
        port: process.env.RDS_PE_PORT,
        user: process.env.RDS_PE_USER,
        password: process.env.RDS_PE_PASSWORD,
        database: process.env.RDS_PE_DATABASE,
      };
    } else {
      return {
        host: process.env.RDS_CL_HOST,
        port: process.env.RDS_CL_PORT,
        user: process.env.RDS_CL_USER,
        password: process.env.RDS_CL_PASSWORD,
        database: process.env.RDS_CL_DATABASE,
      };
    }
  }

  private simulateDelay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
