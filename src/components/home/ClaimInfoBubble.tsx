import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

/** A one-time-per-visit explainer on the Available to Claim tab: only an
 *  institution owner can actually claim seforim here. Shown fresh every
 *  time this tab is opened (it's a new component instance each time —
 *  see SeforimPage's `{tab === 'claim' && ...}`), and dismisses itself on
 *  the first scroll so it doesn't get in the way of browsing. */
export function ClaimInfoBubble() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    function handleScroll() {
      setVisible(false);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <Card className="mb-3 space-y-2">
      <p className="text-sm text-text-muted">{t('seforim.claimInfoBubble')}</p>
      <Button variant="secondary" onClick={() => navigate('/profile?tab=institution')}>
        {t('institution.becomeOwner')}
      </Button>
    </Card>
  );
}
