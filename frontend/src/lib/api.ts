import axios from 'axios';

// The backend runs on port 3000, so we target that.
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  // This is crucial for sending cookies (like the httpOnly auth cookie)
  // from the browser to the backend on subsequent requests.
  withCredentials: true, 
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;