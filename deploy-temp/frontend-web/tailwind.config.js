/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Токены цветов Messager (тёмная тема)
        'app-bg': '#0b0b0b',           // Основной фон
        'app-surface': '#2d2d2f',      // Поверхность (карточки, поля ввода)
        'app-surface-hover': '#3d3d3f', // Поверхность при наведении
        'app-accent': '#0a84ff',       // Акцентный цвет (кнопки, ссылки)
        'app-accent-hover': '#409cff', // Акцент при наведении
        'app-text': '#ffffff',         // Основной текст
        'app-text-secondary': '#86868a', // Вторичный текст
        'app-border': 'rgba(255, 255, 255, 0.1)', // Границы
        'app-error': '#ff3b30',        // Ошибки
        'app-success': '#34c759',      // Успех
      },
    },
  },
  plugins: [],
}
