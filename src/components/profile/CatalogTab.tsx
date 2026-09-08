import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { deleteVendorListing, listSefarim } from '../../services/sefarim';
import { updateCatalogLayout } from '../../services/users';
import type { CatalogLayoutEntry, Sefer } from '../../types';
import { SeferForm } from '../vendor/SeferForm';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { SeferThumbnail } from '../ui/SeferThumbnail';
import { ChevronDownIcon, ChevronUpIcon, CloseIcon } from '../ui/icons';

function reconcileLayout(existing: CatalogLayoutEntry[], mine: Sefer[]): CatalogLayoutEntry[] {
  const mineIds = new Set(mine.map((s) => s.seferId));
  const placedIds = new Set(
    existing.filter((e) => e.kind === 'sefer').map((e) => (e as { seferId: string }).seferId),
  );
  const pruned = existing.filter((e) => e.kind === 'divider' || mineIds.has(e.seferId));
  const additions: CatalogLayoutEntry[] = mine
    .filter((s) => !placedIds.has(s.seferId))
    .map((s) => ({ kind: 'sefer', seferId: s.seferId }));
  return [...pruned, ...additions];
}

export function CatalogTab() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [sefarim, setSefarim] = useState<Sefer[]>([]);
  const [layout, setLayout] = useState<CatalogLayoutEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGroupLabel, setNewGroupLabel] = useState('');

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const all = await listSefarim();
      const mine = all.filter((s) => s.vendorListings.some((l) => l.vendorId === profile.uid));
      const next = reconcileLayout(profile.catalogLayout ?? [], mine);
      setSefarim(mine);
      setLayout(next);
      setLoading(false);
      if (JSON.stringify(next) !== JSON.stringify(profile.catalogLayout ?? [])) {
        void updateCatalogLayout(profile.uid, next);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.uid]);

  function persist(next: CatalogLayoutEntry[]) {
    setLayout(next);
    if (profile) void updateCatalogLayout(profile.uid, next);
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= layout.length) return;
    const next = [...layout];
    [next[index], next[target]] = [next[target], next[index]];
    persist(next);
  }

  function addDivider() {
    const label = newGroupLabel.trim();
    if (!label) return;
    persist([...layout, { kind: 'divider', id: crypto.randomUUID(), label }]);
    setNewGroupLabel('');
  }

  function removeDivider(id: string) {
    persist(layout.filter((e) => !(e.kind === 'divider' && e.id === id)));
  }

  async function removeSefer(seferId: string) {
    if (!profile) return;
    await deleteVendorListing(seferId, profile.uid);
    setSefarim((prev) => prev.filter((s) => s.seferId !== seferId));
    persist(layout.filter((e) => !(e.kind === 'sefer' && e.seferId === seferId)));
  }

  async function reloadAfterAdd() {
    if (!profile) return;
    setShowAddForm(false);
    const all = await listSefarim();
    const mine = all.filter((s) => s.vendorListings.some((l) => l.vendorId === profile.uid));
    setSefarim(mine);
    persist(reconcileLayout(layout, mine));
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-3">
      {layout.map((entry, index) => {
        const canMoveUp = index > 0;
        const canMoveDown = index < layout.length - 1;
        const moveControls = (
          <div className="flex shrink-0 flex-col">
            <button
              type="button"
              disabled={!canMoveUp}
              onClick={() => move(index, -1)}
              aria-label={t('catalog.moveUp') ?? ''}
              className="text-text-muted disabled:opacity-30"
            >
              <ChevronUpIcon width={16} height={16} />
            </button>
            <button
              type="button"
              disabled={!canMoveDown}
              onClick={() => move(index, 1)}
              aria-label={t('catalog.moveDown') ?? ''}
              className="text-text-muted disabled:opacity-30"
            >
              <ChevronDownIcon width={16} height={16} />
            </button>
          </div>
        );

        if (entry.kind === 'divider') {
          return (
            <div key={entry.id} className="flex items-center gap-2 pt-2">
              {moveControls}
              <div className="h-px flex-1 bg-border" />
              <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-text-muted">
                {entry.label}
              </span>
              <div className="h-px flex-1 bg-border" />
              <button
                type="button"
                onClick={() => removeDivider(entry.id)}
                aria-label={t('actions.delete') ?? ''}
                className="text-text-muted"
              >
                <CloseIcon width={14} height={14} />
              </button>
            </div>
          );
        }

        const sefer = sefarim.find((s) => s.seferId === entry.seferId);
        if (!sefer) return null;
        const listing = sefer.vendorListings.find((l) => l.vendorId === profile?.uid);
        return (
          <Card key={entry.seferId} className="flex items-center gap-3">
            {moveControls}
            <SeferThumbnail imageUrl={listing?.imageUrls?.[0]} alt={sefer.englishName} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">
                {sefer.englishName} · {sefer.hebrewName}
              </p>
              <p className="text-sm text-text-muted">{t(`sefer.${sefer.type}`)}</p>
              <p className="text-sm">
                ${listing?.price.toFixed(2)} — {listing?.inStock ? t('vendor.inStock') : '—'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => removeSefer(entry.seferId)}
              aria-label={t('actions.delete') ?? ''}
              className="shrink-0 self-start text-xs font-medium text-error"
            >
              {t('actions.delete')}
            </button>
          </Card>
        );
      })}

      <Card className="flex gap-2">
        <input
          value={newGroupLabel}
          onChange={(e) => setNewGroupLabel(e.target.value)}
          placeholder={t('catalog.newGroupLabel') ?? ''}
          className="min-w-0 flex-1 rounded-btn border border-border px-3 py-2 text-sm"
        />
        <Button variant="secondary" onClick={addDivider} disabled={!newGroupLabel.trim()}>
          {t('catalog.addGroup')}
        </Button>
      </Card>

      {showAddForm ? (
        <SeferForm onSaved={reloadAfterAdd} />
      ) : (
        <Button onClick={() => setShowAddForm(true)}>{t('vendor.addSefer')}</Button>
      )}
    </div>
  );
}
