import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { CheckCircleIcon } from '../ui/icons';
import { VendorApplicationForm } from './VendorApplicationForm';

/** Seforim page's tab for anyone who isn't an approved vendor yet — explains
 *  how being a vendor works and leads straight into the same application
 *  flow as Profile > Settings' VendorSection, which this mirrors. */
export function BecomeVendorTab() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [applying, setApplying] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!profile) return null;

  if (profile.isVendor && !profile.vendorApproved) {
    return (
      <Card>
        <p className="text-sm text-text-muted">{t('vendor.applicationPending')}</p>
      </Card>
    );
  }

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
    <Card className="space-y-3">
      <h2 className="text-sm font-semibold">{t('vendor.becomeVendor')}</h2>
      <p className="text-sm text-text-muted">{t('vendor.becomeVendorExplanation')}</p>
      <Button onClick={() => setApplying(true)}>{t('vendor.becomeVendor')}</Button>
    </Card>
  );
}
