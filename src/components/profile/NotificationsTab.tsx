import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { listMyNotifications, markNotificationRead } from '../../services/notifications';
import { approveVendor, getUser } from '../../services/users';
import type { Notification, User } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';

export function NotificationsTab() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [applicantsById, setApplicantsById] = useState<Map<string, User>>(new Map());
  const [loading, setLoading] = useState(true);
  const [deciding, setDeciding] = useState<string | null>(null);
  const [decidedIds, setDecidedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!profile) return;
    listMyNotifications(profile.uid)
      .then(async (list) => {
        setNotifications(list);
        const vendorUids = [...new Set(list.map((n) => n.relatedVendorUid).filter((v): v is string => !!v))];
        const applicants = await Promise.all(vendorUids.map((uid) => getUser(uid)));
        setApplicantsById(
          new Map(applicants.filter((u): u is User => !!u).map((u) => [u.uid, u])),
        );
      })
      .finally(() => setLoading(false));
  }, [profile]);

  function markRead(notificationId: string) {
    markNotificationRead(notificationId);
    setNotifications((prev) => prev.map((x) => (x.notificationId === notificationId ? { ...x, read: true } : x)));
  }

  async function handleDecision(notification: Notification, approve: boolean) {
    if (!notification.relatedVendorUid) return;
    setDeciding(notification.notificationId);
    try {
      await approveVendor({ uid: notification.relatedVendorUid, approve });
      markRead(notification.notificationId);
      setDecidedIds((prev) => new Set(prev).add(notification.notificationId));
    } finally {
      setDeciding(null);
    }
  }

  if (loading) return <LoadingSpinner />;
  if (notifications.length === 0) return <p className="text-text-muted">{t('home.empty')}</p>;

  return (
    <div>
      {notifications.map((n) => {
        const applicant = n.relatedVendorUid ? applicantsById.get(n.relatedVendorUid) : undefined;
        const application = applicant?.vendorApplication;
        const isPendingApplication =
          !!n.relatedVendorUid && applicant?.vendorApproved === false && !decidedIds.has(n.notificationId);

        return (
          <Card key={n.notificationId} className={`mb-3 ${n.read ? 'opacity-60' : ''}`}>
            <div onClick={() => !n.read && markRead(n.notificationId)} className="cursor-pointer">
              <p className="text-sm font-semibold">{n.title}</p>
              <p className="text-sm text-text-muted">{n.body}</p>
            </div>

            {application && (
              <div className="mt-2 space-y-0.5 text-sm">
                <p>
                  <span className="text-text-muted">{t('vendor.companyName')}:</span> {application.companyName}
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

            {isPendingApplication && (
              <div className="mt-3 flex gap-2">
                <Button disabled={deciding === n.notificationId} onClick={() => handleDecision(n, true)}>
                  {t('admin.approve')}
                </Button>
                <Button
                  variant="secondary"
                  disabled={deciding === n.notificationId}
                  onClick={() => handleDecision(n, false)}
                >
                  {t('admin.reject')}
                </Button>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
