import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { RequireAuth } from './components/RequireAuth';
import { HomePage } from './pages/HomePage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { DonationFlowPage } from './pages/DonationFlowPage';
import { DonationConfirmationPage } from './pages/DonationConfirmationPage';
import { CampaignCreatePage } from './pages/CampaignCreatePage';
import { CampaignDetailPage } from './pages/CampaignDetailPage';
import { CampaignEditPage } from './pages/CampaignEditPage';
import { VendorPage } from './pages/VendorPage';
import { AdminPage } from './pages/AdminPage';

// TODO: replace "Sefer Share" with final platform name
export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
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
              path="/profile"
              element={
                <RequireAuth>
                  <ProfilePage />
                </RequireAuth>
              }
            />
            <Route
              path="/donate"
              element={
                <RequireAuth>
                  <DonationFlowPage />
                </RequireAuth>
              }
            />
            <Route path="/donate/confirmation" element={<DonationConfirmationPage />} />
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
              path="/vendor"
              element={
                <RequireAuth>
                  <VendorPage />
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
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </AuthProvider>
  );
}
