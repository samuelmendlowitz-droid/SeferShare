import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getNeshama, updateNeshama, deleteNeshama } from '../services/neshamos';
import { SEFER_TYPES, type Neshama, type ParentGender, type SeferType } from '../types';
import { NESHAMA_PREFIXES, OTHER_PREFIX_VALUE } from '../lib/neshamaPrefixes';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { FIELD_LABEL_CLASS, TextField } from '../components/ui/TextField';

export function NeshamaEditPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { neshamaId } = useParams();

  const [neshama, setNeshama] = useState<Neshama | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [name, setName] = useState('');
  const [hebrewName, setHebrewName] = useState('');
  const [namePrefix, setNamePrefix] = useState<string | undefined>(undefined);
  const [customNamePrefix, setCustomNamePrefix] = useState('');
  const [parentGender, setParentGender] = useState<ParentGender>('son');
  const [fatherHebrewName, setFatherHebrewName] = useState('');
  const [seferTypes, setSeferTypes] = useState<SeferType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!neshamaId) return;
    getNeshama(neshamaId).then((n) => {
      if (!n) {
        setNotFound(true);
        return;
      }
      setNeshama(n);
      setName(n.name);
      setHebrewName(n.hebrewName ?? '');
      setNamePrefix(n.namePrefix);
      setCustomNamePrefix(n.customNamePrefix ?? '');
      setParentGender(n.parentGender);
      setFatherHebrewName(n.fatherHebrewName);
      setSeferTypes(n.seferTypes ?? []);
    });
  }, [neshamaId]);

  if (notFound) {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-6">
        <Button variant="secondary" className="mb-4" onClick={() => navigate('/')}>
          {t('actions.back')}
        </Button>
        <p className="text-text-muted">{t('neshama.notFound')}</p>
      </div>
    );
  }

  if (!neshama) return <LoadingSpinner fullScreen />;

  if (profile?.uid !== neshama.createdByUid) {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-6">
        <p className="text-text-muted">Not authorized.</p>
      </div>
    );
  }

  function toggleSeferType(type: SeferType) {
    setSeferTypes((prev) => (prev.includes(type) ? prev.filter((t2) => t2 !== type) : [...prev, type]));
  }

  async function handleSave() {
    if (!neshama || !name.trim() || !fatherHebrewName.trim()) return;
    setError(null);
    setSaving(true);
    try {
      await updateNeshama(neshama.neshamaId, {
        name: name.trim(),
        hebrewName: hebrewName.trim() || undefined,
        namePrefix,
        customNamePrefix: namePrefix === OTHER_PREFIX_VALUE ? customNamePrefix.trim() || undefined : undefined,
        parentGender,
        fatherHebrewName: fatherHebrewName.trim(),
        seferTypes,
      });
      navigate(`/neshamos/${neshama.neshamaId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!neshama) return;
    if (!window.confirm(t('neshama.confirmDelete') ?? '')) return;
    setDeleting(true);
    try {
      await deleteNeshama(neshama.neshamaId);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-6">
      <Button variant="secondary" className="mb-4" onClick={() => navigate(`/neshamos/${neshama.neshamaId}`)}>
        {t('actions.back')}
      </Button>

      <h1 className="mb-4 text-lg font-bold">{t('neshama.edit')}</h1>

      <div className="space-y-2">
        <TextField label={t('neshama.name')} value={name} onChange={setName} />
        <TextField label={t('neshama.hebrewName')} value={hebrewName} onChange={setHebrewName} />
        <div>
          <p className={FIELD_LABEL_CLASS}>{t('neshama.namePrefixLabel')}</p>
          <div className="flex flex-wrap gap-2">
            {NESHAMA_PREFIXES.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setNamePrefix((prev) => (prev === option.value ? undefined : option.value))}
                className={`rounded-pill border px-3 py-1.5 text-sm font-medium transition-colors duration-200 ${
                  namePrefix === option.value
                    ? 'border-accent bg-accent text-white'
                    : 'border-border bg-surface text-text-muted hover:border-accent hover:text-accent'
                }`}
              >
                {option.en} · {option.he}
              </button>
            ))}
          </div>
          {namePrefix === OTHER_PREFIX_VALUE && (
            <div className="mt-2">
              <TextField label={t('neshama.customNamePrefixLabel')} value={customNamePrefix} onChange={setCustomNamePrefix} />
            </div>
          )}
        </div>
        <div>
          <p className={FIELD_LABEL_CLASS}>{t('neshama.parentGenderLabel')}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setParentGender('son')}
              className={`flex-1 rounded-btn border px-3 py-2 text-sm font-medium ${
                parentGender === 'son' ? 'border-accent bg-accent text-white' : 'border-border text-text-muted'
              }`}
            >
              {t('neshama.son')}
            </button>
            <button
              type="button"
              onClick={() => setParentGender('daughter')}
              className={`flex-1 rounded-btn border px-3 py-2 text-sm font-medium ${
                parentGender === 'daughter' ? 'border-accent bg-accent text-white' : 'border-border text-text-muted'
              }`}
            >
              {t('neshama.daughter')}
            </button>
          </div>
        </div>
        <TextField label={t('neshama.fatherHebrewName')} value={fatherHebrewName} onChange={setFatherHebrewName} />
        <div>
          <p className={FIELD_LABEL_CLASS}>{t('neshama.seferTypesLabel')}</p>
          <div className="flex flex-wrap gap-2">
            {SEFER_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => toggleSeferType(type)}
                className={`rounded-pill border px-3 py-1.5 text-sm font-medium transition-colors duration-200 ${
                  seferTypes.includes(type)
                    ? 'border-accent bg-accent text-white'
                    : 'border-border bg-surface text-text-muted hover:border-accent hover:text-accent'
                }`}
              >
                {t(`sefer.${type}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-error">{error}</p>}

      <Button
        className="mt-4 w-full"
        disabled={saving || !name.trim() || !fatherHebrewName.trim()}
        onClick={handleSave}
      >
        {t('campaign.saveChanges')}
      </Button>

      <Card className="mt-6 border-error/30">
        <p className="mb-3 text-sm text-text-muted">{t('neshama.deleteHint')}</p>
        <Button variant="secondary" className="w-full text-error" disabled={deleting} onClick={handleDelete}>
          {t('neshama.delete')}
        </Button>
      </Card>
    </div>
  );
}
