import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { ChatsProvider } from './contexts/ChatsContext';
import { ToastProvider } from './contexts/ToastContext';
import { ConnectionBanner } from './components/ConnectionBanner';
import { GlobalIncomingCallOverlay } from './components/GlobalIncomingCallOverlay';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ChatsPage } from './pages/ChatsPage';
import { ChatPage } from './pages/ChatPage';
import { SettingsPage } from './pages/SettingsPage';
import { TelegramApp } from './pages/TelegramApp';
import { initializeTheme } from './utils/theme';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function AppRoutes() {
  useEffect(() => {
    // Инициализация темы при загрузке
    initializeTheme();
  }, []);

  return (
    <>
      <ConnectionBanner />
      <GlobalIncomingCallOverlay />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/telegram" element={<TelegramApp />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <ChatsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/chat/:chatId"
          element={
            <PrivateRoute>
              <ChatPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <SettingsPage />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <WebSocketProvider>
          <BrowserRouter>
            <ChatsProvider>
              <AppRoutes />
            </ChatsProvider>
          </BrowserRouter>
        </WebSocketProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
