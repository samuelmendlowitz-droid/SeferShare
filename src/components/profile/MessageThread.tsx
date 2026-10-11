import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { listMessages, sendMessage } from '../../services/conversations';
import type { ConversationMessage } from '../../types';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface MessageThreadProps {
  conversationId: string;
}

/** The "little message box" opened from an application notification (or a
 *  message_received notification pointing back at it) — the full back-and-
 *  forth with whoever's on the other end, plus a reply box. Reloads from
 *  Firestore on send rather than subscribing live, matching this app's
 *  fetch-on-demand convention elsewhere (no onSnapshot usage anywhere else). */
export function MessageThread({ conversationId }: MessageThreadProps) {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  async function reload() {
    setMessages(await listMessages(conversationId));
  }

  useEffect(() => {
    setLoading(true);
    reload().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  async function handleSend() {
    if (!profile || !draft.trim()) return;
    setSending(true);
    try {
      await sendMessage(conversationId, profile.uid, draft.trim());
      setDraft('');
      await reload();
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-3 rounded-btn border border-border bg-bg p-3">
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="mb-2 max-h-56 space-y-2 overflow-y-auto">
          {messages.length === 0 && <p className="text-xs text-text-muted">{t('messages.empty')}</p>}
          {messages.map((m) => {
            const isMine = m.senderUid === profile?.uid;
            return (
              <div key={m.messageId} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-btn px-3 py-1.5 text-sm ${
                    isMine ? 'bg-accent text-white' : 'border border-border bg-surface'
                  }`}
                >
                  {m.body}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t('messages.placeholder') ?? ''}
          className="min-w-0 flex-1 rounded-btn border border-border px-3 py-2 text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
        />
        <Button disabled={!draft.trim() || sending} onClick={handleSend}>
          {t('messages.send')}
        </Button>
      </div>
    </div>
  );
}
