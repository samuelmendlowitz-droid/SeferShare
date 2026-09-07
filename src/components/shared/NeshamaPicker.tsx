import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Neshama } from '../../types';
import { createNeshama, listNeshamos } from '../../services/neshamos';

interface NeshamaPickerProps {
  value?: string;
  onChange: (neshamaId: string | undefined) => void;
  allowCreate?: boolean;
}

export function NeshamaPicker({ value, onChange, allowCreate = false }: NeshamaPickerProps) {
  const { t } = useTranslation();
  const [neshamos, setNeshamos] = useState<Neshama[]>([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [hebrewName, setHebrewName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    listNeshamos().then(setNeshamos);
  }, []);

  async function handleCreate() {
    if (!name) return;
    const id = await createNeshama({
      name,
      hebrewName: hebrewName || undefined,
      relationship: relationship || undefined,
      message: message || undefined,
    });
    setNeshamos((prev) => [...prev, { neshamaId: id, name, hebrewName, relationship, message, campaignCount: 0, createdAt: Date.now() }]);
    onChange(id);
    setCreating(false);
    setName('');
    setHebrewName('');
    setRelationship('');
    setMessage('');
  }

  if (creating) {
    return (
      <div className="space-y-2 rounded-btn border border-border p-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('neshama.name') ?? ''}
          className="w-full rounded-btn border border-border px-3 py-2 text-sm"
        />
        <input
          value={hebrewName}
          onChange={(e) => setHebrewName(e.target.value)}
          placeholder={t('neshama.hebrewName') ?? ''}
          className="w-full rounded-btn border border-border px-3 py-2 text-sm"
        />
        <input
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          placeholder={t('neshama.relationship') ?? ''}
          className="w-full rounded-btn border border-border px-3 py-2 text-sm"
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t('neshama.message') ?? ''}
          className="w-full rounded-btn border border-border px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={handleCreate}
          className="rounded-btn bg-accent px-3 py-1.5 text-xs font-medium text-white"
        >
          {t('actions.add')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="w-full rounded-btn border border-border px-3 py-2 text-sm"
      >
        <option value="">{t('campaign.selectWho')}</option>
        {neshamos.map((n) => (
          <option key={n.neshamaId} value={n.neshamaId}>
            {n.name}
          </option>
        ))}
      </select>
      {allowCreate && (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="whitespace-nowrap rounded-btn border border-accent px-3 py-2 text-xs font-medium text-accent"
        >
          {t('actions.add')}
        </button>
      )}
    </div>
  );
}
