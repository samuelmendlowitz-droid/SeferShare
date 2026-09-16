import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { usePushka, type PushkaGiftCard, type PushkaItem } from '../context/PushkaContext';
import { getCampaign } from '../services/campaigns';
import { getNeshama } from '../services/neshamos';
import { neshamaDedicationLine, prefixedName } from '../lib/neshamaFormat';
import { DEFAULT_STICKER_DESIGN, normalizeStickerDesign } from '../lib/stickerDesign';
import { updateDefaultStickerDesign } from '../services/users';
import type { Campaign, DonationAd, DonationDedication, DonationGiftCard, Neshama, StickerDesign } from '../types';
import type { PickedItem } from '../components/donation/SeferPicker';
import { CheckoutStep } from '../components/donation/CheckoutStep';
import { CartDedicationPicker } from '../components/donation/CartDedicationPicker';
import { VirtualDedicationCard, type StickerInfo } from '../components/donation/VirtualDedicationCard';
import { StickerDesignEditor } from '../components/donation/StickerDesignEditor';
import type { StickerContent } from '../components/donation/StickerPreview';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { NumberField } from '../components/ui/NumberField';
import { SeferThumbnail } from '../components/ui/SeferThumbnail';
import { TextField, TextAreaField } from '../components/ui/TextField';
import { GiftIcon, MinusIcon, PlusIcon, CloseIcon } from '../components/ui/icons';

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

  // Seed once from the donor's saved default the first time their profile loads,
  // without clobbering choices they've already made in this session.
  useEffect(() => {
    if (stickerDesignSeeded || !profile) return;
    // normalizeStickerDesign repairs a default saved under an older shape of
    // StickerDesign (e.g. before per-element fonts existed) — without this, a
    // stale saved default would crash the editor every time it's opened.
    if (profile.defaultStickerDesign) setStickerDesign(normalizeStickerDesign(profile.defaultStickerDesign));
    setStickerDesignSeeded(true);
  }, [profile, stickerDesignSeeded]);

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

  async function handlePaid() {
    setPaidItems(pushka.items);
    setPaidGiftCards(pushka.giftCards);
    const stickers: StickerInfo[] = campaignStickerGroups.map((g) => ({
      label: g.campaignTitle || t('campaign.untitled'),
      name: prefixedName(g.neshama, false) ?? g.neshama.name,
      hebrewName: prefixedName(g.neshama, true),
    }));
    if (dedicationNeshama) {
      stickers.push({
        label: t('donation.yourDedicationTitle'),
        name: prefixedName(dedicationNeshama, false) ?? dedicationNeshama.name,
        hebrewName: prefixedName(dedicationNeshama, true),
      });
    } else if (hasAlgorithmStickerItems) {
      stickers.push({ label: t('donation.yourDedicationTitle'), name: t('donation.algorithmChoice') });
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
  const stickerPreviewContent: StickerContent = {
    label: dedicationNeshama
      ? t('donation.yourDedicationTitle')
      : campaignStickerGroups[0]?.campaignTitle || t('donation.yourDedicationTitle'),
    dedicationName: previewNeshama
      ? (prefixedName(previewNeshama, false) ?? previewNeshama.name)
      : t('donation.algorithmChoice'),
    dedicationHebrewName: previewNeshama ? prefixedName(previewNeshama, true) : undefined,
    donorName: profile?.displayName,
  };

  if (step === 'confirmation') {
    return (
      <div className="mx-auto max-w-2xl px-4 pb-24 pt-6">
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
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-6">
      <Button variant="secondary" className="mb-4" onClick={() => navigate('/')}>
        {t('actions.back')}
      </Button>

      <h1 className="mb-4 text-lg font-bold">{t('pushka.title')}</h1>

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

            {[...groups.byCampaign.entries()].map(([campaignId, items]) => (
              <div key={campaignId}>
                <button
                  type="button"
                  onClick={() => navigate(`/campaigns/${campaignId}`)}
                  className="mb-2 text-sm font-semibold text-accent hover:underline"
                >
                  {items[0].campaignTitle || t('campaign.untitled')}
                </button>
                <div className="space-y-2">
                  {items.map((item) => (
                    <PushkaRow key={pushka.keyFor(item)} item={item} />
                  ))}
                </div>
              </div>
            ))}

            {groups.plainItems.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold text-text-muted">{t('pushka.otherSeforim')}</p>
                <div className="space-y-2">
                  {groups.plainItems.map((item) => (
                    <PushkaRow key={pushka.keyFor(item)} item={item} />
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

      <Modal open={stickerEditorOpen} onClose={() => setStickerEditorOpen(false)} title={t('sticker.editorTitle')}>
        <StickerDesignEditor
          value={stickerDesign}
          onChange={setStickerDesign}
          content={stickerPreviewContent}
          onSaveDefault={profile ? () => updateDefaultStickerDesign(profile.uid, stickerDesign) : undefined}
        />
      </Modal>
    </div>
  );
}

function GiftCardRow({ giftCard }: { giftCard: PushkaGiftCard }) {
  const { t } = useTranslation();
  const pushka = usePushka();

  return (
    <Card className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-btn bg-accent/10 text-accent">
        <GiftIcon width={20} height={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">
          {giftCard.campaignTitle || giftCard.institutionName || t('donation.giftCardOption')}
        </p>
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
  const key = pushka.keyFor(item);

  return (
    <Card className="flex items-center gap-3">
      <SeferThumbnail imageUrl={item.imageUrl} alt={item.englishName} size={48} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">
          {item.englishName} · {item.hebrewName}
        </p>
        <p className="text-xs text-text-muted">${item.price.toFixed(2)} each</p>
      </div>
      <div className="flex shrink-0 items-center gap-1 rounded-btn border border-border">
        <button
          type="button"
          onClick={() => pushka.updateQuantity(key, item.quantity - 1)}
          aria-label={t('pushka.decreaseQuantity') ?? ''}
          className="flex h-8 w-8 items-center justify-center text-text-muted"
        >
          <MinusIcon width={14} height={14} />
        </button>
        <span className="w-6 text-center text-sm">{item.quantity}</span>
        <button
          type="button"
          onClick={() => pushka.updateQuantity(key, item.quantity + 1)}
          aria-label={t('pushka.increaseQuantity') ?? ''}
          className="flex h-8 w-8 items-center justify-center text-text-muted"
        >
          <PlusIcon width={14} height={14} />
        </button>
      </div>
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
