import { defineStore } from 'pinia'
import api from '../api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    loading: false,
    error: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    isEmployee: (state) => state.user?.role === 'employee',
    isEmployer: (state) => state.user?.role === 'employer',
  },

  actions: {
    async register(payload) {
      this.loading = true
      this.error = null
      try {
        const { data } = await api.post('/auth/register', payload)
        this._setSession(data)
        return data
      } catch (err) {
        this.error = err.response?.data?.message || 'Registration failed.'
        throw err
      } finally {
        this.loading = false
      }
    },

    async login(payload) {
      this.loading = true
      this.error = null
      try {
        const { data } = await api.post('/auth/login', payload)
        this._setSession(data)
        return data
      } catch (err) {
        this.error = err.response?.data?.message || 'Login failed.'
        throw err
      } finally {
        this.loading = false
      }
    },

    logout() {
      this.user = null
      this.token = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },

    _setSession(data) {
      this.token = data.token
      this.user = data.user
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
    },
  },
})
