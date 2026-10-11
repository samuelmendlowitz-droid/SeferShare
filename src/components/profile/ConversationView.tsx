import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { getConversation, listMessages, markConversationRead, sendMessage } from '../../services/conversations';
import { approveInstitutionOwner, approveVendor, getUser } from '../../services/users';
import type { Conversation, ConversationMessage, User } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ArrowLeftIcon } from '../ui/icons';

interface ConversationViewProps {
  conversationId: string;
  onBack: () => void;
}

/** The full "little message box" for one admin↔applicant thread: the
 *  application itself, the decision, and any back-and-forth, all in one
 *  running chat. Opened from the conversation list in NotificationsTab. */
export function ConversationView({ conversationId, onBack }: ConversationViewProps) {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { dir } = useLanguage();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [applicant, setApplicant] = useState<User | null>(null);
  const [counterpart, setCounterpart] = useState<User | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [deciding, setDeciding] = useState(false);
  const [decided, setDecided] = useState(false);

  async function reload() {
    const [conv, msgs] = await Promise.all([getConversation(conversationId), listMessages(conversationId)]);
    setConversation(conv);
    setMessages(msgs);
    if (conv) {
      const otherUid = conv.participants.find((uid) => uid !== profile?.uid);
      const [applicantUser, counterpartUser] = await Promise.all([
        getUser(conv.applicantUid),
        otherUid ? getUser(otherUid) : Promise.resolve(null),
      ]);
      setApplicant(applicantUser);
      setCounterpart(counterpartUser);
    }
  }

  useEffect(() => {
    setLoading(true);
    reload().finally(() => setLoading(false));
    if (profile) markConversationRead(conversationId, profile.uid);
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

  async function handleDecision(approve: boolean) {
    if (!conversation) return;
    setDeciding(true);
    try {
      if (conversation.context === 'vendor') await approveVendor({ uid: conversation.applicantUid, approve });
      else await approveInstitutionOwner({ uid: conversation.applicantUid, approve });
      setDecided(true);
      await reload();
    } finally {
      setDeciding(false);
    }
  }

  if (loading || !conversation) return <LoadingSpinner />;

  // Whichever participant isn't the applicant is the admin reviewing it — only
  // they get Approve/Reject (an applicant viewing their own thread never does).
  const isAdminView = profile?.uid !== conversation.applicantUid;
  const currentlyApproved =
    conversation.context === 'vendor' ? applicant?.vendorApproved : applicant?.institutionOwnerApproved;
  const isPending = isAdminView && !decided && currentlyApproved === false;

  const title =
    (conversation.context === 'vendor'
      ? applicant?.vendorApplication?.companyName
      : applicant?.institutionOwnerApplication?.institutionName) ??
    counterpart?.displayName ??
    applicant?.displayName ??
    '…';

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          aria-label={t('actions.back') ?? ''}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-text-muted hover:text-accent"
        >
          <ArrowLeftIcon width={18} height={18} style={dir === 'rtl' ? { transform: 'scaleX(-1)' } : undefined} />
        </button>
        <p className="min-w-0 flex-1 truncate text-base font-semibold">{title}</p>
      </div>

      <div className="mb-3 max-h-[55vh] space-y-2 overflow-y-auto">
        {messages.map((m) => {
          if (m.kind === 'application_submitted') {
            return (
              <Card key={m.messageId}>
                <p className="mb-1 text-xs font-semibold text-text-muted">{t('messages.applicationSubmitted')}</p>
                <p className="whitespace-pre-line text-sm">{m.body}</p>
              </Card>
            );
          }
          if (m.kind === 'application_approved' || m.kind === 'application_declined') {
            return (
              <p
                key={m.messageId}
                className={`text-center text-xs font-medium ${
                  m.kind === 'application_approved' ? 'text-success' : 'text-error'
                }`}
              >
                {m.body}
              </p>
            );
          }
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

      {isPending && (
        <div className="mb-3 flex gap-2">
          <Button disabled={deciding} onClick={() => handleDecision(true)}>
            {t('admin.approve')}
          </Button>
          <Button variant="secondary" disabled={deciding} onClick={() => handleDecision(false)}>
            {t('admin.reject')}
          </Button>
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
