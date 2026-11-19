import { useState, type FormEvent } from 'react';
import type { SupabaseClient, User } from '@supabase/supabase-js';

export default function AuthControls({ client, user }: { client: SupabaseClient | null; user: User | null }) {
  const [expanded, setExpanded] = useState(false);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!client) return null;

  const signIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSent(false);
    const { error: signInError } = await client.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin, shouldCreateUser: true },
    });
    setBusy(false);
    if (signInError) setError(signInError.message);
    else setSent(true);
  };

  const signOut = async () => {
    setError('');
    const { error: signOutError } = await client.auth.signOut();
    if (signOutError) setError(signOutError.message);
    else location.hash = 'radar';
  };

  if (user) {
    return (
      <div className="auth-controls">
        <span className="auth-user" title={user.email ?? ''}>동기화됨 · {user.email}</span>
        <button className="btn sm" onClick={signOut}>로그아웃</button>
        {error && <span className="auth-message error" role="alert">{error}</span>}
      </div>
    );
  }

  return (
    <div className="auth-controls">
      {!expanded ? (
        <button className="btn sm" onClick={() => setExpanded(true)}>로그인·동기화</button>
      ) : (
        <form className="auth-form" onSubmit={signIn}>
          <label className="sr-only" htmlFor="auth-email">이메일 주소</label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="이메일 주소"
          />
          <button className="btn sm primary" disabled={busy}>{busy ? '전송 중…' : '로그인 링크 받기'}</button>
          <button className="btn sm" type="button" onClick={() => { setExpanded(false); setSent(false); setError(''); }}>닫기</button>
        </form>
      )}
      {sent && <span className="auth-message" role="status">로그인 링크를 보냈습니다. 이메일에서 링크를 열어주세요.</span>}
      {error && <span className="auth-message error" role="alert">로그인 링크를 보내지 못했습니다: {error}</span>}
    </div>
  );
}
