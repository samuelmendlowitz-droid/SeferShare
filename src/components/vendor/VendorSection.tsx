import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { applyToBeVendor } from '../../services/users';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export function VendorSection() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const navigate = useNavigate();

  if (!profile) return null;

  if (!profile.isVendor) {
    return (
      <Card>
        <Button variant="secondary" onClick={() => applyToBeVendor(profile.uid)}>
          Apply to become a vendor
        </Button>
      </Card>
    );
  }

  if (!profile.vendorApproved) {
    return (
      <Card>
        <p className="text-sm text-text-muted">
          Your vendor application is pending approval.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="mb-2 text-sm font-semibold text-text-muted">{t('vendor.catalog')}</h2>
      <Button onClick={() => navigate('/vendor')}>{t('vendor.catalog')}</Button>
    </Card>
  );
}
