import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { listInstitutionsByOwner } from '../../services/institutions';
import type { Institution } from '../../types';
import { InstitutionOwnerApplicationForm } from '../shared/InstitutionOwnerApplicationForm';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { CheckCircleIcon, EditIcon } from '../ui/icons';

/** Profile's "My Institution" tab: the institution-owner application flow
 *  (mirrors VendorSection), then — once approved — the list of institutions
 *  this account owns, each with its verification status, an edit entry, and a
 *  link into Campaigns pre-filtered to that institution's own campaigns
 *  (rather than a separate "campaigns for my institution" page/feed). */
export function MyInstitutionTab() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [applying, setApplying] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);

  const approved = Boolean(profile?.isInstitutionOwner && profile.institutionOwnerApproved);

  async function reload() {
    if (!profile) return;
    setLoading(true);
    try {
      setInstitutions(await listInstitutionsByOwner(profile.uid));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (approved) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approved, profile?.uid]);

  if (!profile) return null;

  if (!profile.isInstitutionOwner) {
    if (submitted) {
      return (
        <Card className="flex flex-col items-center gap-2 py-6 text-center">
          <CheckCircleIcon className="text-success" width={40} height={40} />
          <p className="text-sm text-text-muted">{t('institution.ownerApplicationSubmitted')}</p>
        </Card>
      );
    }
    if (applying) {
      return (
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-text-muted">{t('institution.becomeOwner')}</h2>
          <InstitutionOwnerApplicationForm onSubmitted={() => setSubmitted(true)} />
        </Card>
      );
    }
    return (
      <Card>
        <p className="mb-3 text-sm text-text-muted">{t('institution.becomeOwnerHint')}</p>
        <Button onClick={() => setApplying(true)}>{t('institution.becomeOwner')}</Button>
      </Card>
    );
  }

  if (!profile.institutionOwnerApproved) {
    return (
      <Card>
        <p className="text-sm text-text-muted">{t('institution.ownerApplicationPending')}</p>
      </Card>
    );
  }

  return (
    <>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-3">
          {institutions.length === 0 && <p className="text-text-muted">{t('institution.noneYet')}</p>}
          {institutions.map((inst) => (
            <Card key={inst.institutionId}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{inst.name}</p>
                  <p className={`text-xs ${inst.verified ? 'text-success' : 'text-text-muted'}`}>
                    {inst.verified ? t('institution.verified') : t('institution.unverified')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/institutions/${inst.institutionId}/edit`)}
                  aria-label={t('institution.edit') ?? ''}
                  className="shrink-0 text-text-muted hover:text-accent"
                >
                  <EditIcon width={16} height={16} />
                </button>
              </div>
              <Button
                variant="secondary"
                className="mt-3 w-full"
                onClick={() => navigate(`/campaigns?institution=${inst.institutionId}`)}
              >
                {t('institution.viewCampaigns')}
              </Button>
            </Card>
          ))}

          <Button className="w-full" onClick={() => navigate('/institutions/new')}>
            {t('institution.addNew')}
          </Button>
        </div>
      )}
    </>
  );
}
