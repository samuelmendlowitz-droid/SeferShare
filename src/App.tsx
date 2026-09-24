import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { PushkaProvider } from './context/PushkaContext';
import { DetailStackProvider } from './context/DetailStackContext';
import { RequireAuth } from './components/RequireAuth';
import { DetailStackOverlay } from './components/details/DetailStackOverlay';
import { HomePage } from './pages/HomePage';
import { CampaignsPage } from './pages/CampaignsPage';
import { SeforimPage } from './pages/SeforimPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { PushkaPage } from './pages/PushkaPage';
import { DonationConfirmationPage } from './pages/DonationConfirmationPage';
import { NeshamaDonatePage } from './pages/NeshamaDonatePage';
import { AdminPage } from './pages/AdminPage';

// TODO: replace "Sefer Share" with final platform name
export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <PushkaProvider>
          <BrowserRouter>
            <DetailStackProvider>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                  path="/"
                  element={
                    <RequireAuth>
                      <HomePage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/campaigns"
                  element={
                    <RequireAuth>
                      <CampaignsPage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/seforim"
                  element={
                    <RequireAuth>
                      <SeforimPage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <RequireAuth>
                      <ProfilePage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/pushka"
                  element={
                    <RequireAuth>
                      <PushkaPage />
                    </RequireAuth>
                  }
                />
                <Route path="/donate/confirmation" element={<DonationConfirmationPage />} />
                <Route
                  path="/neshamos/:neshamaId/donate"
                  element={
                    <RequireAuth>
                      <NeshamaDonatePage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <RequireAuth>
                      <AdminPage />
                    </RequireAuth>
                  }
                />
                {/* Catches stale links to routes that no longer exist: the old
                    /campaigns/:id, /institutions/:id, /neshamos/:id detail pages
                    (now popups — see DetailStackContext); /campaigns/new,
                    /campaigns/:id/edit, /institutions/:id/edit, and
                    /neshamos/:id/edit (now the + / Edit buttons' popup forms);
                    /vendor (folded into Seforim > My Gallery); and
                    /institutions/:id/spend (now Seforim > Gallery's institution
                    switcher) — instead of rendering blank. */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              <DetailStackOverlay />
            </DetailStackProvider>
          </BrowserRouter>
        </PushkaProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
