/**
 * API Configuration
 * Change the API_BASE_URL based on your environment
 */

const CONFIG = {
  // Local development with serverless-offline
  local: 'http://localhost:3000',

  // Development environment (replace with your actual API Gateway URL)
  dev: 'https://nlhic74tlk.execute-api.us-east-1.amazonaws.com',

  // Production environment (replace with your actual API Gateway URL)
  prod: 'https://your-api-id.execute-api.us-east-1.amazonaws.com/prod'
};

// Change this to 'dev' or 'prod' when deploying
const ENVIRONMENT = 'dev';

// Export the selected API base URL
const API_BASE_URL = CONFIG[ENVIRONMENT];
