import axios from 'axios'

const baseURL = 'https://localhost:7239/api/v1'

export const axiosClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})
