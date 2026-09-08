import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { CheckCircleIcon } from '../ui/icons';
import { VendorApplicationForm } from './VendorApplicationForm';

export function VendorSection() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [applying, setApplying] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!profile) return null;

  if (!profile.isVendor) {
    if (submitted) {
      return (
        <Card className="flex flex-col items-center gap-2 py-6 text-center">
          <CheckCircleIcon className="text-success" width={40} height={40} />
          <p className="text-sm text-text-muted">{t('vendor.applicationSubmitted')}</p>
        </Card>
      );
    }
    if (applying) {
      return (
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-text-muted">{t('vendor.becomeVendor')}</h2>
          <VendorApplicationForm onSubmitted={() => setSubmitted(true)} />
        </Card>
      );
    }
    return (
      <Card>
        <Button variant="secondary" onClick={() => setApplying(true)}>
          {t('vendor.becomeVendor')}
        </Button>
      </Card>
    );
  }

  if (!profile.vendorApproved) {
    return (
      <Card>
        <p className="text-sm text-text-muted">{t('vendor.applicationPending')}</p>
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
