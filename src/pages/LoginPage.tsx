import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signInWithGoogle, signInWithEmail, registerWithEmail } = useAuth();
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (mode === 'signIn') {
        await signInWithEmail(email, password);
      } else {
        await registerWithEmail(email, password, displayName);
      }
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <h1 className="mb-6 text-center text-2xl font-bold text-accent">{t('app.name')}</h1>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'signUp' && (
            <input
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t('auth.displayName') ?? ''}
              className="w-full rounded-btn border border-border px-3 py-2 text-sm"
            />
          )}
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('auth.email') ?? ''}
            className="w-full rounded-btn border border-border px-3 py-2 text-sm"
          />
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('auth.password') ?? ''}
            className="w-full rounded-btn border border-border px-3 py-2 text-sm"
          />
          {error && <p className="text-sm text-error">{error}</p>}
          <Button type="submit" className="w-full">
            {mode === 'signIn' ? t('auth.signIn') : t('auth.signUp')}
          </Button>
        </form>

        <button
          type="button"
          className="mt-3 w-full text-center text-sm text-accent-soft"
          onClick={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')}
        >
          {mode === 'signIn' ? t('auth.signUp') : t('auth.signIn')}
        </button>

        <Button
          variant="secondary"
          className="mt-3 w-full"
          onClick={async () => {
            try {
              await signInWithGoogle();
              navigate('/');
            } catch (err) {
              setError(err instanceof Error ? err.message : String(err));
            }
          }}
        >
          {t('auth.continueWithGoogle')}
        </Button>
      </Card>
    </div>
  );
}
