/**
 * API Client - Reusable fetch functions for the Medical Appointment System
 */

class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  /**
   * Generic request handler with error handling
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return { success: true, data };
    } catch (error) {
      console.error('API Request Error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * GET /health - Health check
   */
  async healthCheck() {
    return this.request('/health');
  }

  /**
   * POST /appointments - Create a new appointment
   * @param {Object} appointmentData - Appointment details
   */
  async createAppointment(appointmentData) {
    return this.request('/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
  }

  /**
   * GET /insured/{insuredId}/appointments - Get appointments by insured ID
   * @param {string} insuredId - The insured person's ID
   */
  async getAppointmentsByInsured(insuredId) {
    return this.request(`/insured/${insuredId}/appointments`);
  }

  /**
   * GET /appointments/{appointmentId} - Get appointment by ID
   * @param {string} appointmentId - The appointment ID
   */
  async getAppointmentById(appointmentId) {
    return this.request(`/appointments/${appointmentId}`);
  }
}

// Create and export a singleton instance
const apiClient = new ApiClient(API_BASE_URL);
