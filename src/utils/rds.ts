import { AppointmentRequest } from '../types';

// Mock RDS connection - En producción, usarías mysql2
export async function saveToRDS(
  appointment: AppointmentRequest & { appointmentId: string },
  country: 'PE' | 'CL'
): Promise<void> {
  const dbConfig = country === 'PE'
    ? {
        host: process.env.RDS_PE_HOST,
        port: process.env.RDS_PE_PORT,
        user: process.env.RDS_PE_USER,
        password: process.env.RDS_PE_PASSWORD,
        database: process.env.RDS_PE_DATABASE,
      }
    : {
        host: process.env.RDS_CL_HOST,
        port: process.env.RDS_CL_PORT,
        user: process.env.RDS_CL_USER,
        password: process.env.RDS_CL_PASSWORD,
        database: process.env.RDS_CL_DATABASE,
      };

  console.log(`[RDS ${country}] Simulando guardado en base de datos:`, {
    config: { ...dbConfig, password: '***' },
    appointment,
  });

  // const connection = await mysql.createConnection(dbConfig);
  // await connection.execute(
  //   'INSERT INTO appointments (id, insured_id, schedule_id, country_iso, created_at) VALUES (?, ?, ?, ?, ?)',
  //   [appointment.appointmentId, appointment.insuredId, appointment.scheduleId, appointment.countryISO, new Date()]
  // );
  // await connection.end();

  // Simular delay de BD
  await new Promise(resolve => setTimeout(resolve, 100));
}
