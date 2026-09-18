import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { PushkaProvider } from './context/PushkaContext';
import { DetailStackProvider } from './context/DetailStackContext';
import { RequireAuth } from './components/RequireAuth';
import { DetailStackOverlay } from './components/details/DetailStackOverlay';
import { HomePage } from './pages/HomePage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { PushkaPage } from './pages/PushkaPage';
import { DonationConfirmationPage } from './pages/DonationConfirmationPage';
import { CampaignCreatePage } from './pages/CampaignCreatePage';
import { CampaignEditPage } from './pages/CampaignEditPage';
import { InstitutionEditPage } from './pages/InstitutionEditPage';
import { InstitutionSpendPage } from './pages/InstitutionSpendPage';
import { NeshamaEditPage } from './pages/NeshamaEditPage';
import { NeshamaDonatePage } from './pages/NeshamaDonatePage';
import { VendorPage } from './pages/VendorPage';
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
                  path="/campaigns/new"
                  element={
                    <RequireAuth>
                      <CampaignCreatePage />
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
                  path="/institutions/:institutionId/edit"
                  element={
                    <RequireAuth>
                      <InstitutionEditPage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/institutions/:institutionId/spend"
                  element={
                    <RequireAuth>
                      <InstitutionSpendPage />
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
                  path="/neshamos/:neshamaId/donate"
                  element={
                    <RequireAuth>
                      <NeshamaDonatePage />
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
              <DetailStackOverlay />
            </DetailStackProvider>
          </BrowserRouter>
        </PushkaProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
