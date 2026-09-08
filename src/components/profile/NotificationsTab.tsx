import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { listMyNotifications, markNotificationRead } from '../../services/notifications';
import type { Notification } from '../../types';
import { Card } from '../ui/Card';
import { LoadingSpinner } from '../ui/LoadingSpinner';

export function NotificationsTab() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    listMyNotifications(profile.uid)
      .then(setNotifications)
      .finally(() => setLoading(false));
  }, [profile]);

  if (loading) return <LoadingSpinner />;
  if (notifications.length === 0) return <p className="text-text-muted">{t('home.empty')}</p>;

  return (
    <div>
      {notifications.map((n) => (
        <Card
          key={n.notificationId}
          className={`mb-3 cursor-pointer ${n.read ? 'opacity-60' : ''}`}
          onClick={() => {
            if (!n.read) {
              markNotificationRead(n.notificationId);
              setNotifications((prev) =>
                prev.map((x) => (x.notificationId === n.notificationId ? { ...x, read: true } : x)),
              );
            }
          }}
        >
          <p className="text-sm font-semibold">{n.title}</p>
          <p className="text-sm text-text-muted">{n.body}</p>
        </Card>
      ))}
    </div>
  );
}
