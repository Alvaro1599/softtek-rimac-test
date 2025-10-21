export interface AppointmentRequest {
  insuredId: string;
  scheduleId: number;
  countryISO: 'PE' | 'CL';
}

export interface AppointmentRecord {
  appointmentId: string;
  insuredId: string;
  scheduleId: number;
  countryISO: 'PE' | 'CL';
  status: 'pending' | 'completed';
  createdAt: string;
  updatedAt?: string;
}

export interface AppointmentCompletedEvent {
  appointmentId: string;
  insuredId: string;
  scheduleId: number;
  countryISO: 'PE' | 'CL';
  timestamp: string;
}
