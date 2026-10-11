import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { listMyConversations } from '../../services/conversations';
import { getUser } from '../../services/users';
import type { Conversation, User } from '../../types';
import { Card } from '../ui/Card';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ConversationView } from './ConversationView';

/** Every notification between two people — an application arriving, its
 *  decision, any follow-up questions — lives in one running conversation
 *  with that person (see ConversationView). This tab is just the list of
 *  those conversations; tapping one opens the full chat. */
export function NotificationsTab() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [peopleById, setPeopleById] = useState<Map<string, User>>(new Map());
  const [loading, setLoading] = useState(true);
  const [openConversationId, setOpenConversationId] = useState<string | null>(null);

  async function reload() {
    if (!profile) return;
    const list = await listMyConversations(profile.uid);
    setConversations(list);
    const otherUids = [
      ...new Set(
        list
          .map((c) => c.participants.find((uid) => uid !== profile.uid))
          .filter((v): v is string => !!v),
      ),
    ];
    const people = await Promise.all(otherUids.map((uid) => getUser(uid)));
    setPeopleById(new Map(people.filter((u): u is User => !!u).map((u) => [u.uid, u])));
  }

  useEffect(() => {
    reload().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  if (loading) return <LoadingSpinner />;

  if (openConversationId) {
    return (
      <ConversationView
        conversationId={openConversationId}
        onBack={() => {
          setOpenConversationId(null);
          reload();
        }}
      />
    );
  }

  if (conversations.length === 0) return <p className="text-text-muted">{t('home.empty')}</p>;

  return (
    <div>
      {conversations.map((c) => {
        const otherUid = c.participants.find((uid) => uid !== profile?.uid);
        const other = otherUid ? peopleById.get(otherUid) : undefined;
        const title =
          (c.context === 'vendor'
            ? other?.vendorApplication?.companyName
            : other?.institutionOwnerApplication?.institutionName) ??
          other?.displayName ??
          '…';
        const lastRead = (profile && c.lastRead?.[profile.uid]) || 0;
        const unread = !!c.lastMessageAt && c.lastMessageAt > lastRead;

        return (
          <Card key={c.conversationId} className="mb-3 cursor-pointer" onClick={() => setOpenConversationId(c.conversationId)}>
            <div className="flex items-start gap-2">
              {unread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-error" aria-hidden="true" />}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{title}</p>
                {c.lastMessageBody && <p className="truncate text-sm text-text-muted">{c.lastMessageBody}</p>}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
