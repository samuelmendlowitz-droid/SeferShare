import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { usePushka, type PushkaGiftCard, type PushkaItem } from '../context/PushkaContext';
import { getCampaign } from '../services/campaigns';
import { getInstitution } from '../services/institutions';
import { getNeshama } from '../services/neshamos';
import { neshamaDedicationLine, prefixedName } from '../lib/neshamaFormat';
import { DEFAULT_STICKER_DESIGN, normalizeStickerDesign } from '../lib/stickerDesign';
import { useStickerDesigns } from '../hooks/useStickerDesigns';
import type {
  Campaign,
  DonationAd,
  DonationDedication,
  DonationGiftCard,
  Institution,
  Neshama,
  StickerDesign,
} from '../types';
import type { PickedItem } from '../components/donation/SeferPicker';
import { CheckoutStep } from '../components/donation/CheckoutStep';
import { CartDedicationPicker } from '../components/donation/CartDedicationPicker';
import { SeferDestinationSheet, type SeferDestination } from '../components/donation/SeferDestinationSheet';
import { DetailPageLayout } from '../components/layout/DetailPageLayout';
import { VirtualDedicationCard, type StickerInfo } from '../components/donation/VirtualDedicationCard';
import { StickerDesignEditor } from '../components/donation/StickerDesignEditor';
import type { StickerContent } from '../components/donation/StickerPreview';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { NumberField } from '../components/ui/NumberField';
import { QuantityStepper } from '../components/ui/QuantityStepper';
import { SeferThumbnail } from '../components/ui/SeferThumbnail';
import { TextField, TextAreaField } from '../components/ui/TextField';
import { GiftIcon, CloseIcon } from '../components/ui/icons';

function toPickedItem(item: PushkaItem): PickedItem {
  return {
    seferId: item.seferId,
    vendorId: item.vendorId,
    vendorName: item.vendorName,
    englishName: item.englishName,
    hebrewName: item.hebrewName,
    price: item.price,
    quantity: item.quantity,
    imageUrl: item.imageUrl,
    campaignId: item.campaignId,
    requestedInstitutionId: item.institutionId,
    availableForClaim: item.availableForClaim,
  };
}

function toDonationGiftCard(giftCard: PushkaGiftCard): DonationGiftCard {
  return {
    institutionId: giftCard.institutionId,
    institutionName: giftCard.institutionName,
    campaignId: giftCard.campaignId,
    campaignTitle: giftCard.campaignTitle,
    amount: giftCard.amount,
  };
}

/** What a plain (non-campaign) item's destination row says: a specifically
 *  chosen mokom, "let an institution claim it" (donated as free stock), or the
 *  default "no mokom selected" — see SeferDestinationSheet for how it's set. */
function destinationText(
  item: PushkaItem,
  institutionsById: Map<string, Institution>,
  t: (key: string, opts?: Record<string, unknown>) => string,
): string {
  if (item.institutionId) {
    return t('pushka.goingTo', { name: institutionsById.get(item.institutionId)?.name ?? '…' });
  }
  if (item.availableForClaim) return t('pushka.letInstitutionClaim');
  return t('pushka.noDestinationSelected');
}

interface SuggestedDedication {
  neshamaId: string;
  name: string;
  hebrewName?: string;
  namePrefix?: string;
  customNamePrefix?: string;
  parentGender: Neshama['parentGender'];
  fatherHebrewName: string;
}

export function PushkaPage() {
  const { t } = useTranslation();
  const { showBilingual } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const pushka = usePushka();

  const suggestedDedication = (location.state as { suggestedDedication?: SuggestedDedication } | null)
    ?.suggestedDedication;

  const [step, setStep] = useState<'form' | 'confirmation'>('form');
  const [donorMessage, setDonorMessage] = useState('');
  const [dedicationNeshamaId, setDedicationNeshamaId] = useState<string | undefined>(
    suggestedDedication?.neshamaId,
  );
  const [dedicationNeshama, setDedicationNeshama] = useState<Neshama | undefined>(
    suggestedDedication
      ? {
          neshamaId: suggestedDedication.neshamaId,
          createdByUid: '',
          name: suggestedDedication.name,
          hebrewName: suggestedDedication.hebrewName,
          namePrefix: suggestedDedication.namePrefix,
          customNamePrefix: suggestedDedication.customNamePrefix,
          parentGender: suggestedDedication.parentGender,
          fatherHebrewName: suggestedDedication.fatherHebrewName,
          createdAt: 0,
        }
      : undefined,
  );
  const [includeAd, setIncludeAd] = useState(false);
  const [ad, setAd] = useState<DonationAd>({ businessName: '', message: '' });
  const [campaignsById, setCampaignsById] = useState<Map<string, Campaign>>(new Map());
  const [campaignNeshamasById, setCampaignNeshamasById] = useState<Map<string, Neshama>>(new Map());
  const [paidItems, setPaidItems] = useState<PushkaItem[]>([]);
  const [paidGiftCards, setPaidGiftCards] = useState<PushkaGiftCard[]>([]);
  const [paidStickers, setPaidStickers] = useState<StickerInfo[]>([]);
  const [paidStickerDesign, setPaidStickerDesign] = useState<StickerDesign>(DEFAULT_STICKER_DESIGN);

  const [stickerDesign, setStickerDesign] = useState<StickerDesign>(DEFAULT_STICKER_DESIGN);
  const [stickerDesignSeeded, setStickerDesignSeeded] = useState(false);
  const [stickerEditorOpen, setStickerEditorOpen] = useState(false);
  const stickerDesignsData = useStickerDesigns(profile?.uid);

  // Seed once from the designer's most-recently-updated saved design, the first
  // time their library finishes loading — without clobbering choices they've
  // already made in this session.
  useEffect(() => {
    if (stickerDesignSeeded || stickerDesignsData.loading) return;
    // normalizeStickerDesign repairs a design saved under an older shape of
    // StickerDesign (e.g. before per-element fonts existed) — without this, a
    // stale saved design would crash the editor every time it's opened.
    const mostRecent = stickerDesignsData.designs[0];
    if (mostRecent) setStickerDesign(normalizeStickerDesign(mostRecent.design));
    setStickerDesignSeeded(true);
  }, [stickerDesignsData.loading, stickerDesignsData.designs, stickerDesignSeeded]);

  const groups = useMemo(() => {
    const byCampaign = new Map<string, PushkaItem[]>();
    const plainItems: PushkaItem[] = [];
    for (const item of pushka.items) {
      if (item.campaignId) {
        const list = byCampaign.get(item.campaignId) ?? [];
        list.push(item);
        byCampaign.set(item.campaignId, list);
      } else {
        plainItems.push(item);
      }
    }
    return { byCampaign, plainItems };
  }, [pushka.items]);

  useEffect(() => {
    const campaignIds = [...groups.byCampaign.keys()];
    if (campaignIds.length === 0) {
      setCampaignsById(new Map());
      return;
    }
    Promise.all(campaignIds.map((id) => getCampaign(id))).then((results) => {
      const map = new Map<string, Campaign>();
      results.forEach((c, idx) => {
        if (c) map.set(campaignIds[idx], c);
      });
      setCampaignsById(map);
    });
  }, [groups.byCampaign]);

  useEffect(() => {
    const neshamaIds = [
      ...new Set(
        [...campaignsById.values()].map((c) => c.neshamaIds?.[0]).filter((id): id is string => Boolean(id)),
      ),
    ];
    if (neshamaIds.length === 0) {
      setCampaignNeshamasById(new Map());
      return;
    }
    Promise.all(neshamaIds.map((id) => getNeshama(id))).then((results) => {
      const map = new Map<string, Neshama>();
      results.forEach((n, idx) => {
        if (n) map.set(neshamaIds[idx], n);
      });
      setCampaignNeshamasById(map);
    });
  }, [campaignsById]);

  // Campaigns that already carry their own neshama always print it on the sticker,
  // regardless of the donor's cart-wide choice below (spec: "the first option that's
  // on the campaign" — only overridden if the donor explicitly picks their own).
  const campaignStickerGroups = useMemo(
    () =>
      [...groups.byCampaign.entries()]
        .map(([campaignId, items]) => {
          const neshamaId = campaignsById.get(campaignId)?.neshamaIds?.[0];
          return {
            campaignId,
            campaignTitle: items[0].campaignTitle,
            neshama: neshamaId ? campaignNeshamasById.get(neshamaId) : undefined,
          };
        })
        .filter((g): g is typeof g & { neshama: Neshama } => Boolean(g.neshama)),
    [groups.byCampaign, campaignsById, campaignNeshamasById],
  );

  // Everything else needs a dedication: the donor's cart-wide pick if they made one,
  // otherwise the server-side algorithm assigns one per Sefer at checkout (spec:
  // "picks names from the algorithm... based on who's gone longest without a dedication").
  const hasAlgorithmStickerItems = useMemo(() => {
    if (groups.plainItems.length > 0) return true;
    for (const campaignId of groups.byCampaign.keys()) {
      if (!campaignsById.get(campaignId)?.neshamaIds?.length) return true;
    }
    return false;
  }, [groups, campaignsById]);

  // The institution behind the donor's own cart-wide dedication / the algorithm's
  // pick — only knowable here when every item that would use it was added to a
  // single specific institution (either directly, or via a campaign with no
  // neshama of its own). Left undefined (nothing shown on the sticker) whenever
  // that's ambiguous — the real destination is still resolved server-side.
  const generalInstitutionId = useMemo(() => {
    const ids = new Set<string>();
    for (const item of groups.plainItems) {
      if (item.institutionId) ids.add(item.institutionId);
    }
    for (const campaignId of groups.byCampaign.keys()) {
      const campaign = campaignsById.get(campaignId);
      if (campaign && !campaign.neshamaIds?.length) ids.add(campaign.institutionId);
    }
    return ids.size === 1 ? [...ids][0] : undefined;
  }, [groups, campaignsById]);

  const [institutionsById, setInstitutionsById] = useState<Map<string, Institution>>(new Map());
  const [destinationTarget, setDestinationTarget] = useState<PushkaItem | null>(null);

  // Plain (non-campaign) items grouped by sefer+vendor so a sefer split across
  // multiple destinations (e.g. some going to a chosen mokom, some not) shows
  // as one card with a breakdown, instead of one row per destination.
  const plainItemGroups = useMemo(() => {
    const map = new Map<string, PushkaItem[]>();
    for (const item of groups.plainItems) {
      const key = `${item.seferId}_${item.vendorId}`;
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    return [...map.values()];
  }, [groups.plainItems]);

  useEffect(() => {
    // Every campaign group's own institution (for its "Going to X" line) and
    // every plain item's directly-chosen institution (same), on top of what
    // the sticker/dedication logic below separately needs.
    const ids = [
      ...new Set(
        [
          ...[...campaignsById.values()].map((c) => c.institutionId),
          ...groups.plainItems.map((item) => item.institutionId),
          ...campaignStickerGroups.map((g) => campaignsById.get(g.campaignId)?.institutionId),
          generalInstitutionId,
        ].filter((id): id is string => Boolean(id)),
      ),
    ];
    if (ids.length === 0) {
      setInstitutionsById(new Map());
      return;
    }
    Promise.all(ids.map((id) => getInstitution(id))).then((results) => {
      const map = new Map<string, Institution>();
      results.forEach((inst, idx) => {
        if (inst) map.set(ids[idx], inst);
      });
      setInstitutionsById(map);
    });
  }, [campaignsById, groups.plainItems, campaignStickerGroups, generalInstitutionId]);

  async function handlePaid() {
    setPaidItems(pushka.items);
    setPaidGiftCards(pushka.giftCards);
    const stickers: StickerInfo[] = campaignStickerGroups.map((g) => {
      const institutionId = campaignsById.get(g.campaignId)?.institutionId;
      return {
        label: g.campaignTitle || t('campaign.untitled'),
        name: prefixedName(g.neshama, false) ?? g.neshama.name,
        hebrewName: prefixedName(g.neshama, true),
        fatherHebrewName: g.neshama.fatherHebrewName,
        parentGender: g.neshama.parentGender,
        donatedTo: institutionId ? institutionsById.get(institutionId)?.name : undefined,
      };
    });
    const generalDonatedTo = generalInstitutionId ? institutionsById.get(generalInstitutionId)?.name : undefined;
    if (dedicationNeshama) {
      stickers.push({
        name: prefixedName(dedicationNeshama, false) ?? dedicationNeshama.name,
        hebrewName: prefixedName(dedicationNeshama, true),
        fatherHebrewName: dedicationNeshama.fatherHebrewName,
        parentGender: dedicationNeshama.parentGender,
        donatedTo: generalDonatedTo,
      });
    } else if (hasAlgorithmStickerItems) {
      stickers.push({ name: t('donation.algorithmChoice'), donatedTo: generalDonatedTo });
    }
    setPaidStickers(stickers);
    setPaidStickerDesign(stickerDesign);
    pushka.clear();
    setDedicationNeshamaId(undefined);
    setDedicationNeshama(undefined);
    setDonorMessage('');
    setStep('confirmation');
  }

  const donorDedication: DonationDedication | undefined = dedicationNeshama
    ? {
        name: dedicationNeshama.name,
        hebrewName: dedicationNeshama.hebrewName,
        namePrefix: dedicationNeshama.namePrefix,
        customNamePrefix: dedicationNeshama.customNamePrefix,
        parentGender: dedicationNeshama.parentGender,
        fatherHebrewName: dedicationNeshama.fatherHebrewName,
      }
    : undefined;

  // What the sticker editor's live preview shows: the donor's own cart-wide pick if
  // they made one, else the first campaign's neshama, else a placeholder — the same
  // priority the printed sticker itself follows (see stickers[] above).
  const previewNeshama = dedicationNeshama ?? campaignStickerGroups[0]?.neshama;
  const previewInstitutionId = dedicationNeshama
    ? generalInstitutionId
    : campaignsById.get(campaignStickerGroups[0]?.campaignId ?? '')?.institutionId;
  const stickerPreviewContent: StickerContent = {
    label: dedicationNeshama ? undefined : campaignStickerGroups[0]?.campaignTitle,
    dedicationName: previewNeshama
      ? (prefixedName(previewNeshama, false) ?? previewNeshama.name)
      : t('donation.algorithmChoice'),
    dedicationHebrewName: previewNeshama ? prefixedName(previewNeshama, true) : undefined,
    dedicationFatherHebrewName: previewNeshama?.fatherHebrewName,
    dedicationParentGender: previewNeshama?.parentGender,
    donorName: profile?.displayName,
    donatedTo: previewInstitutionId ? institutionsById.get(previewInstitutionId)?.name : undefined,
  };

  if (step === 'confirmation') {
    return (
      <DetailPageLayout fallbackPath="/">
        <h1 className="mb-4 text-xl font-bold">{t('pushka.title')}</h1>
        <VirtualDedicationCard
          donorName={profile?.displayName ?? ''}
          items={paidItems.map((item) => toPickedItem(item))}
          giftCards={paidGiftCards}
          stickers={paidStickers}
          stickerDesign={paidStickerDesign}
          ad={includeAd && ad.businessName.trim() ? ad : undefined}
        />
        <Button className="mt-4 w-full" onClick={() => navigate('/')}>
          {t('actions.done')}
        </Button>
      </DetailPageLayout>
    );
  }

  return (
    <DetailPageLayout fallbackPath="/">
      <h1 className="mb-4 text-xl font-bold">{t('pushka.title')}</h1>
      {pushka.items.length === 0 && pushka.giftCards.length === 0 ? (
        <div className="text-center">
          <p className="mb-4 text-text-muted">{t('pushka.empty')}</p>
          <Button onClick={() => navigate('/')}>{t('pushka.goHome')}</Button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {pushka.giftCards.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold text-text-muted">{t('donation.giftCardOption')}</p>
                <div className="space-y-2">
                  {pushka.giftCards.map((giftCard) => (
                    <GiftCardRow key={giftCard.id} giftCard={giftCard} />
                  ))}
                </div>
              </div>
            )}

            {[...groups.byCampaign.entries()].map(([campaignId, items]) => {
              const institutionId = campaignsById.get(campaignId)?.institutionId;
              return (
                <div key={campaignId}>
                  <button
                    type="button"
                    onClick={() => navigate(`/campaigns/${campaignId}`)}
                    className="text-sm font-semibold text-accent hover:underline"
                  >
                    {items[0].campaignTitle || t('campaign.untitled')}
                  </button>
                  {institutionId && (
                    <p className="mb-2 text-xs text-text-muted">
                      {t('pushka.goingTo', { name: institutionsById.get(institutionId)?.name ?? '…' })}
                    </p>
                  )}
                  <div className={institutionId ? 'space-y-2' : 'mt-2 space-y-2'}>
                    {items.map((item) => (
                      <PushkaRow key={pushka.keyFor(item)} item={item} />
                    ))}
                  </div>
                </div>
              );
            })}

            {plainItemGroups.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold text-text-muted">{t('pushka.otherSeforim')}</p>
                <div className="space-y-2">
                  {plainItemGroups.map((entries) => (
                    <PlainSeferGroup
                      key={`${entries[0].seferId}_${entries[0].vendorId}`}
                      entries={entries}
                      institutionsById={institutionsById}
                      onChooseDestination={setDestinationTarget}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {pushka.items.length > 0 && (
            <>
              <Card className="mt-4">
                <h2 className="mb-1 text-base font-semibold">{t('donation.dedicationsTitle')}</h2>
                <p className="mb-3 text-xs text-text-muted">{t('donation.yourDedicationHint')}</p>

                {campaignStickerGroups.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {campaignStickerGroups.map((g) => (
                      <p key={g.campaignId} className="text-sm text-text-muted">
                        {t('donation.stickerAuto', {
                          campaignTitle: g.campaignTitle || t('campaign.untitled'),
                          liluyNishmat: t('neshama.liluyNishmat'),
                          name: neshamaDedicationLine(g.neshama, showBilingual),
                        })}
                      </p>
                    ))}
                  </div>
                )}

                <CartDedicationPicker
                  value={dedicationNeshamaId}
                  onChange={(id, neshama) => {
                    setDedicationNeshamaId(id);
                    setDedicationNeshama(neshama);
                  }}
                />

                {!dedicationNeshama && hasAlgorithmStickerItems && (
                  <p className="mt-2 text-xs text-text-muted">{t('donation.algorithmWillChooseHint')}</p>
                )}

                <Button variant="secondary" className="mt-3 w-full" onClick={() => setStickerEditorOpen(true)}>
                  {t('sticker.customize')}
                </Button>
              </Card>

              <Card className="mt-4">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" checked={includeAd} onChange={(e) => setIncludeAd(e.target.checked)} />
                  {t('donation.includeAd')}
                </label>
                {includeAd && (
                  <div className="mt-3 space-y-2">
                    <TextField
                      label={t('donation.adBusinessName')}
                      value={ad.businessName}
                      onChange={(v) => setAd({ ...ad, businessName: v })}
                    />
                    <TextField
                      label={t('donation.adMessagePlaceholder')}
                      value={ad.message ?? ''}
                      onChange={(v) => setAd({ ...ad, message: v })}
                    />
                  </div>
                )}
              </Card>
            </>
          )}

          {pushka.giftCards.length > 0 && pushka.items.length === 0 && (
            <p className="mt-4 text-xs text-text-muted">{t('donation.giftCardNoDedicationHint')}</p>
          )}

          <TextAreaField
            label={t('donation.message')}
            value={donorMessage}
            onChange={setDonorMessage}
            rows={3}
            containerClassName="mb-4 mt-4"
          />

          <CheckoutStep
            items={pushka.items.map((item) => toPickedItem(item))}
            giftCards={pushka.giftCards.map((g) => toDonationGiftCard(g))}
            donorMessage={donorMessage}
            donorDedication={donorDedication}
            stickerDesign={pushka.items.length > 0 ? stickerDesign : undefined}
            ad={includeAd && ad.businessName.trim() ? ad : undefined}
            onPaid={handlePaid}
          />
        </>
      )}

      <Modal open={stickerEditorOpen} onClose={() => setStickerEditorOpen(false)} title={t('sticker.editorTitle')} fillBody>
        <StickerDesignEditor
          value={stickerDesign}
          onChange={setStickerDesign}
          content={stickerPreviewContent}
          savedDesigns={stickerDesignsData.designs}
          onCreate={stickerDesignsData.create}
          onUpdateContent={stickerDesignsData.updateContent}
          onRename={stickerDesignsData.rename}
          onDelete={stickerDesignsData.remove}
        />
      </Modal>

      <SeferDestinationSheet
        open={destinationTarget !== null}
        seferId={destinationTarget?.seferId ?? ''}
        onClose={() => setDestinationTarget(null)}
        onSelect={(destination: SeferDestination) => {
          if (destinationTarget) pushka.setItemDestination(pushka.keyFor(destinationTarget), destination);
        }}
      />
    </DetailPageLayout>
  );
}

function GiftCardRow({ giftCard }: { giftCard: PushkaGiftCard }) {
  const { t } = useTranslation();
  const pushka = usePushka();
  const navigate = useNavigate();

  return (
    <Card className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-btn bg-accent/10 text-accent">
        <GiftIcon width={20} height={20} />
      </span>
      <div className="min-w-0 flex-1">
        {giftCard.campaignTitle || giftCard.institutionName ? (
          <button
            type="button"
            className="truncate text-start text-sm font-semibold text-accent hover:underline"
            onClick={() =>
              navigate(
                giftCard.campaignId
                  ? `/campaigns/${giftCard.campaignId}`
                  : `/institutions/${giftCard.institutionId}`,
              )
            }
          >
            {giftCard.campaignTitle || giftCard.institutionName}
          </button>
        ) : (
          <p className="truncate text-sm font-semibold">{t('donation.giftCardOption')}</p>
        )}
        <NumberField
          label={t('donation.amountLabel')}
          value={giftCard.amount}
          onChange={(amount) => pushka.updateGiftCardAmount(giftCard.id, amount)}
          min={0}
          money
          containerClassName="mt-1 w-24"
        />
      </div>
      <button
        type="button"
        onClick={() => pushka.removeGiftCard(giftCard.id)}
        aria-label={t('actions.delete') ?? ''}
        className="shrink-0 text-text-muted"
      >
        <CloseIcon width={16} height={16} />
      </button>
    </Card>
  );
}

function PushkaRow({ item }: { item: PushkaItem }) {
  const { t } = useTranslation();
  const pushka = usePushka();
  const navigate = useNavigate();
  const key = pushka.keyFor(item);

  return (
    <Card className="flex items-center gap-3">
      <SeferThumbnail imageUrl={item.imageUrl} alt={item.englishName} size={48} />
      <div className="min-w-0 flex-1">
        <button
          type="button"
          className="truncate text-start text-sm font-semibold text-accent hover:underline"
          onClick={() => navigate(`/seforim/${item.seferId}`)}
        >
          {item.englishName} · {item.hebrewName}
        </button>
        <p className="text-xs text-text-muted">${item.price.toFixed(2)} each</p>
      </div>
      <QuantityStepper value={item.quantity} onChange={(quantity) => pushka.updateQuantity(key, quantity)} />
      <button
        type="button"
        onClick={() => pushka.removeItem(key)}
        aria-label={t('actions.delete') ?? ''}
        className="shrink-0 text-text-muted"
      >
        <CloseIcon width={16} height={16} />
      </button>
    </Card>
  );
}

/** One card per sefer among the plain (non-campaign) items — a shared
 *  thumbnail/name/price header, then one destination sub-row per underlying
 *  cart entry, so the same sefer split across destinations (e.g. some let-an-
 *  institution-claim, some no-mokom-selected) shows as one card with a
 *  breakdown instead of a separate row per destination. */
function PlainSeferGroup({
  entries,
  institutionsById,
  onChooseDestination,
}: {
  entries: PushkaItem[];
  institutionsById: Map<string, Institution>;
  onChooseDestination: (item: PushkaItem) => void;
}) {
  const { t } = useTranslation();
  const pushka = usePushka();
  const navigate = useNavigate();
  const first = entries[0];

  return (
    <Card>
      <div className="flex items-center gap-3">
        <SeferThumbnail imageUrl={first.imageUrl} alt={first.englishName} size={48} />
        <div className="min-w-0 flex-1">
          <button
            type="button"
            className="truncate text-start text-sm font-semibold text-accent hover:underline"
            onClick={() => navigate(`/seforim/${first.seferId}`)}
          >
            {first.englishName} · {first.hebrewName}
          </button>
          <p className="text-xs text-text-muted">${first.price.toFixed(2)} each</p>
        </div>
      </div>

      <div className="mt-3 space-y-2 border-t border-border pt-3">
        {entries.map((item) => {
          const key = pushka.keyFor(item);
          return (
            <div key={key} className="flex items-center gap-2">
              <QuantityStepper value={item.quantity} onChange={(quantity) => pushka.updateQuantity(key, quantity)} />
              <button
                type="button"
                onClick={() => onChooseDestination(item)}
                className="min-w-0 flex-1 truncate text-start text-xs font-medium text-accent hover:underline"
              >
                {destinationText(item, institutionsById, t)}
              </button>
              <button
                type="button"
                onClick={() => pushka.removeItem(key)}
                aria-label={t('actions.delete') ?? ''}
                className="shrink-0 text-text-muted"
              >
                <CloseIcon width={16} height={16} />
              </button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
