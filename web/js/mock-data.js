/**
 * Mock Data - Medical system data synchronized with backend ScheduleService.ts
 * This data mirrors the backend mock data for a consistent user experience
 */

const MOCK_DATA = {
  specialties: [
    { id: 1, name: 'Cardiología' },
    { id: 2, name: 'Pediatría' },
    { id: 3, name: 'Dermatología' },
    { id: 4, name: 'Oftalmología' },
    { id: 5, name: 'Traumatología' },
  ],

  doctors: {
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
  },

  medicalCenters: {
    PE: [
      'Clínica Lima',
      'Hospital Arequipa',
      'Centro Médico Cusco'
    ],
    CL: [
      'Clínica Las Condes',
      'Hospital Santiago',
      'Centro Médico Viña'
    ],
  },

  times: [
    '08:00',
    '09:00',
    '10:00',
    '11:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
  ],
};
