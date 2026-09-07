import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { updatePreferredLanguage } from '../../services/users';
import type { Language } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { VendorSection } from '../vendor/VendorSection';

const LANGUAGE_OPTIONS: { key: Language; labelKey: string }[] = [
  { key: 'en', labelKey: 'settings.english' },
  { key: 'he', labelKey: 'settings.hebrew' },
  { key: 'both', labelKey: 'settings.both' },
];

export function SettingsTab() {
  const { t } = useTranslation();
  const { profile, signOut } = useAuth();
  const { language, setLanguage } = useLanguage();

  async function handleLanguageChange(lang: Language) {
    setLanguage(lang);
    if (profile) await updatePreferredLanguage(profile.uid, lang);
  }

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="mb-2 text-sm font-semibold text-text-muted">{t('settings.personalInfo')}</h2>
        <p className="text-base">{profile?.displayName}</p>
        <p className="text-sm text-text-muted">{profile?.email}</p>
      </Card>

      <Card>
        <h2 className="mb-2 text-sm font-semibold text-text-muted">{t('settings.language')}</h2>
        <div className="flex gap-2">
          {LANGUAGE_OPTIONS.map((opt) => (
            <Button
              key={opt.key}
              variant={language === opt.key ? 'primary' : 'secondary'}
              onClick={() => handleLanguageChange(opt.key)}
            >
              {t(opt.labelKey)}
            </Button>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-2 text-sm font-semibold text-text-muted">{t('settings.paymentMethods')}</h2>
        {profile?.savedPaymentMethods.length ? (
          profile.savedPaymentMethods.map((pm) => (
            <p key={pm.id} className="text-sm">
              {pm.brand} •••• {pm.last4}
            </p>
          ))
        ) : (
          <p className="text-sm text-text-muted">—</p>
        )}
      </Card>

      <VendorSection />

      <Button variant="secondary" onClick={() => signOut()}>
        {t('settings.signOut')}
      </Button>
    </div>
  );
}
