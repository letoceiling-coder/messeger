import axios, {AxiosInstance, AxiosRequestConfig} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_BASE_URL, TIMEOUTS} from '@config/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: TIMEOUTS.REQUEST,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor - добавляем токен, для FormData убираем Content-Type
    this.api.interceptors.request.use(
      async config => {
        const token = await AsyncStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        if (config.data instanceof FormData) {
          delete config.headers['Content-Type'];
        }
        return config;
      },
      error => Promise.reject(error),
    );

    // Response interceptor - обработка ошибок
    this.api.interceptors.response.use(
      response => response,
      async error => {
        if (error.response?.status === 401) {
          // Токен истёк - выйти из системы
          await AsyncStorage.removeItem('access_token');
          await AsyncStorage.removeItem('user');
          // Можно вызвать навигацию к экрану входа
        }
        return Promise.reject(error);
      },
    );
  }

  // GET request
  async get<T = any>(url: string, config?: AxiosRequestConfig) {
    const response = await this.api.get<T>(url, config);
    return response.data;
  }

  // POST request
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.api.post<T>(url, data, config);
    return response.data;
  }

  // PUT request
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.api.put<T>(url, data, config);
    return response.data;
  }

  // PATCH request
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.api.patch<T>(url, data, config);
    return response.data;
  }

  // DELETE request
  async delete<T = any>(url: string, config?: AxiosRequestConfig) {
    const response = await this.api.delete<T>(url, config);
    return response.data;
  }

  // Upload file (FormData) — Content-Type убирается в interceptor
  async upload<T = any>(url: string, formData: FormData) {
    const response = await this.api.post<T>(url, formData, {
      timeout: TIMEOUTS.UPLOAD,
    });
    return response.data;
  }
}

export default new ApiService();
