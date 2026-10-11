import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { listMyNotifications, markNotificationRead } from '../../services/notifications';
import { approveInstitutionOwner, approveVendor, getUser } from '../../services/users';
import { ensureConversation } from '../../services/conversations';
import type { ConversationContext, Notification, User } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { MessageThread } from './MessageThread';

/** Which applicant uid (if any) a notification is about, and what kind of
 *  application that is — the two application-related notification kinds are
 *  otherwise handled identically throughout this component. */
function applicationContext(n: Notification): { context: ConversationContext; applicantUid: string } | undefined {
  if (n.relatedVendorUid) return { context: 'vendor', applicantUid: n.relatedVendorUid };
  if (n.relatedInstitutionOwnerUid) return { context: 'institutionOwner', applicantUid: n.relatedInstitutionOwnerUid };
  return undefined;
}

export function NotificationsTab() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [applicantsById, setApplicantsById] = useState<Map<string, User>>(new Map());
  const [loading, setLoading] = useState(true);
  const [deciding, setDeciding] = useState<string | null>(null);
  const [decidedIds, setDecidedIds] = useState<Set<string>>(new Set());
  // Which notification's message thread is currently expanded, and which
  // conversation it points at — null means collapsed/not yet started.
  const [openThreads, setOpenThreads] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!profile) return;
    listMyNotifications(profile.uid)
      .then(async (list) => {
        setNotifications(list);
        const applicantUids = [
          ...new Set(
            list
              .map((n) => n.relatedVendorUid ?? n.relatedInstitutionOwnerUid)
              .filter((v): v is string => !!v),
          ),
        ];
        const applicants = await Promise.all(applicantUids.map((uid) => getUser(uid)));
        setApplicantsById(new Map(applicants.filter((u): u is User => !!u).map((u) => [u.uid, u])));
      })
      .finally(() => setLoading(false));
  }, [profile]);

  function markRead(notificationId: string) {
    markNotificationRead(notificationId);
    setNotifications((prev) => prev.map((x) => (x.notificationId === notificationId ? { ...x, read: true } : x)));
  }

  async function handleDecision(notification: Notification, context: ConversationContext, applicantUid: string, approve: boolean) {
    setDeciding(notification.notificationId);
    try {
      if (context === 'vendor') await approveVendor({ uid: applicantUid, approve });
      else await approveInstitutionOwner({ uid: applicantUid, approve });
      markRead(notification.notificationId);
      setDecidedIds((prev) => new Set(prev).add(notification.notificationId));
    } finally {
      setDeciding(null);
    }
  }

  function handleOpenThread(notification: Notification, conversationId: string) {
    markRead(notification.notificationId);
    setOpenThreads((prev) => ({ ...prev, [notification.notificationId]: conversationId }));
  }

  async function handleStartMessage(notification: Notification, context: ConversationContext, applicantUid: string) {
    if (!profile) return;
    const conversationId = await ensureConversation(context, applicantUid, profile.uid);
    handleOpenThread(notification, conversationId);
  }

  if (loading) return <LoadingSpinner />;
  if (notifications.length === 0) return <p className="text-text-muted">{t('home.empty')}</p>;

  return (
    <div>
      {notifications.map((n) => {
        const appCtx = applicationContext(n);
        const applicant = appCtx ? applicantsById.get(appCtx.applicantUid) : undefined;
        const vendorApp = appCtx?.context === 'vendor' ? applicant?.vendorApplication : undefined;
        const institutionApp = appCtx?.context === 'institutionOwner' ? applicant?.institutionOwnerApplication : undefined;
        const application = vendorApp ?? institutionApp;
        const primaryName = vendorApp?.companyName ?? institutionApp?.institutionName;
        const approvedField = appCtx?.context === 'vendor' ? applicant?.vendorApproved : applicant?.institutionOwnerApproved;
        const isPendingApplication =
          !!appCtx &&
          n.kind.endsWith('_received') &&
          approvedField === false &&
          !decidedIds.has(n.notificationId);
        const openConversationId = openThreads[n.notificationId];

        return (
          <Card key={n.notificationId} className="mb-3">
            <div
              onClick={() => {
                markRead(n.notificationId);
                if (n.kind === 'message_received' && n.relatedConversationId) {
                  handleOpenThread(n, n.relatedConversationId);
                }
              }}
              className="flex cursor-pointer items-start gap-2"
            >
              {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-error" aria-hidden="true" />}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{n.title}</p>
                <p className="text-sm text-text-muted">{n.body}</p>
              </div>
            </div>

            {application && (
              <div className="mt-2 space-y-0.5 text-sm">
                <p>
                  <span className="text-text-muted">
                    {appCtx?.context === 'vendor' ? t('vendor.companyName') : t('institution.name')}:
                  </span>{' '}
                  {primaryName}
                </p>
                <p>
                  <span className="text-text-muted">{t('vendor.contactName')}:</span> {application.contactName}
                </p>
                <p>
                  <span className="text-text-muted">{t('auth.email')}:</span> {application.email}
                </p>
                <p>
                  <span className="text-text-muted">{t('auth.phone')}:</span> {application.phone}
                </p>
                <p>
                  <span className="text-text-muted">{t('campaign.shippingAddress')}:</span>{' '}
                  {application.address.line1}, {application.address.city}, {application.address.state}{' '}
                  {application.address.postalCode}
                </p>
                {application.notes && (
                  <p>
                    <span className="text-text-muted">{t('vendor.notesOptional')}:</span> {application.notes}
                  </p>
                )}
              </div>
            )}

            {appCtx && n.kind.endsWith('_received') && (
              <div className="mt-3 flex flex-wrap gap-2">
                {isPendingApplication && (
                  <>
                    <Button
                      disabled={deciding === n.notificationId}
                      onClick={() => handleDecision(n, appCtx.context, appCtx.applicantUid, true)}
                    >
                      {t('admin.approve')}
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={deciding === n.notificationId}
                      onClick={() => handleDecision(n, appCtx.context, appCtx.applicantUid, false)}
                    >
                      {t('admin.reject')}
                    </Button>
                  </>
                )}
                {!openConversationId && (
                  <Button variant="secondary" onClick={() => handleStartMessage(n, appCtx.context, appCtx.applicantUid)}>
                    {t('messages.startConversation')}
                  </Button>
                )}
              </div>
            )}

            {openConversationId && <MessageThread conversationId={openConversationId} />}
          </Card>
        );
      })}
    </div>
  );
}
