/**
 * Базовый HTTP клиент для работы с API
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  }

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body)
  }

  try {
    const response = await fetch(url, config)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(error.error || error.message || `HTTP error! status: ${response.status}`)
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('API request failed:', error)
    throw error
  }
}

export const api = {
  get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, data, options) => request(endpoint, { ...options, method: 'POST', body: data }),
  put: (endpoint, data, options) => request(endpoint, { ...options, method: 'PUT', body: data }),
  delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' })
}

export default api
