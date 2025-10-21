
export interface AppointmentRecord {
  appointmentId: string;
  insuredId: string;
  scheduleId: number;
  countryISO: 'PE' | 'CL';
  status: 'pending' | 'completed';
  createdAt: string;
  updatedAt?: string;
}
