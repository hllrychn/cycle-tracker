import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthContext, useAuthState } from './hooks/useAuth';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { LogPeriodPage } from './pages/LogPeriodPage';
import { LogSymptomsPage } from './pages/LogSymptomsPage';
import { HistoryPage } from './pages/HistoryPage';
import { HealthPage } from './pages/HealthPage';
import { PalettePage } from './pages/PalettePage';
import { FontsPage } from './pages/FontsPage';
import { LoaderPage } from './pages/LoaderPage';

function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthState();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/log/period" element={<LogPeriodPage />} />
            <Route path="/log/symptoms" element={<LogSymptomsPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/health" element={<HealthPage />} />
            <Route path="/palette" element={<PalettePage />} />
            <Route path="/fonts" element={<FontsPage />} />
            <Route path="/loader" element={<LoaderPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
