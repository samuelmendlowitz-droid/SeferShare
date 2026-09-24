import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { PushkaProvider } from './context/PushkaContext';
import { RequireAuth } from './components/RequireAuth';
import { HomePage } from './pages/HomePage';
import { CampaignsPage } from './pages/CampaignsPage';
import { SeforimPage } from './pages/SeforimPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { PushkaPage } from './pages/PushkaPage';
import { DonationConfirmationPage } from './pages/DonationConfirmationPage';
import { NeshamaDonatePage } from './pages/NeshamaDonatePage';
import { AdminPage } from './pages/AdminPage';
import { CampaignDetailPage } from './pages/CampaignDetailPage';
import { CampaignCreatePage } from './pages/CampaignCreatePage';
import { CampaignEditPage } from './pages/CampaignEditPage';
import { InstitutionDetailPage } from './pages/InstitutionDetailPage';
import { InstitutionCreatePage } from './pages/InstitutionCreatePage';
import { InstitutionEditPage } from './pages/InstitutionEditPage';
import { NeshamaDetailPage } from './pages/NeshamaDetailPage';
import { NeshamaEditPage } from './pages/NeshamaEditPage';
import { SeferDetailPage } from './pages/SeferDetailPage';

// TODO: replace "Sefer Share" with final platform name
export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <PushkaProvider>
          <BrowserRouter>
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
                path="/campaigns/new"
                element={
                  <RequireAuth>
                    <CampaignCreatePage />
                  </RequireAuth>
                }
              />
              <Route
                path="/campaigns/:campaignId"
                element={
                  <RequireAuth>
                    <CampaignDetailPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/campaigns/:campaignId/edit"
                element={
                  <RequireAuth>
                    <CampaignEditPage />
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
                path="/seforim/:seferId"
                element={
                  <RequireAuth>
                    <SeferDetailPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/institutions/new"
                element={
                  <RequireAuth>
                    <InstitutionCreatePage />
                  </RequireAuth>
                }
              />
              <Route
                path="/institutions/:institutionId"
                element={
                  <RequireAuth>
                    <InstitutionDetailPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/institutions/:institutionId/edit"
                element={
                  <RequireAuth>
                    <InstitutionEditPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/neshamos/:neshamaId"
                element={
                  <RequireAuth>
                    <NeshamaDetailPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/neshamos/:neshamaId/edit"
                element={
                  <RequireAuth>
                    <NeshamaEditPage />
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
              {/* Catches stale links to routes that no longer exist: /vendor
                  (folded into Seforim > My Gallery) and /institutions/:id/spend
                  (now Seforim > Gallery's institution switcher) — instead of
                  rendering blank. */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </PushkaProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
