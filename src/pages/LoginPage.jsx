import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HERO_IMAGE } from '../data/journeys';
import { useAppState } from '../context/AppStateContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, showToast } = useAppState();
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'reset'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'reset') {
      showToast(`Reset link sent to ${email || 'your email'}`);
      setMode('signin');
      return;
    }
    signIn(mode === 'signup' ? name : '');
    navigate('/profile');
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left Full-Bleed Forest Photo */}
      <div className="relative hidden overflow-hidden lg:block">
        <img
          src={HERO_IMAGE}
          alt="A forest path between cedar trees"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141A18]/80 via-[#141A18]/25 to-[#141A18]/30" />

        <div className="absolute inset-0 flex flex-col justify-between p-12 text-white">
          <p className="font-heading text-xl font-extrabold tracking-[-.02em]">
            MICHI / 道
          </p>
          <h2 className="font-heading max-w-md text-4xl font-extrabold leading-tight tracking-[-.04em]">
            Take the road that gives you a story.
          </h2>
        </div>
      </div>

      {/* Right Sign-In Form */}
      <div className="flex flex-col justify-center bg-[var(--background)] px-6 py-12 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <Link
            to="/"
            className="text-xs font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            ← Back to MICHI
          </Link>

          <p className="mt-8 text-xs font-bold uppercase tracking-[.18em] text-[var(--accent)]">
            {mode === 'signup'
              ? 'JOIN THE ATLAS'
              : mode === 'reset'
                ? 'ACCOUNT RECOVERY'
                : 'WELCOME BACK'}
          </p>
          <h1 className="font-heading mt-2 text-3xl font-extrabold tracking-[-.04em] text-[var(--foreground)] sm:text-4xl">
            {mode === 'signup'
              ? 'Start your field book.'
              : mode === 'reset'
                ? 'Reset your password.'
                : 'Good to see you again.'}
          </h1>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {mode === 'signup' && (
              <div>
                <label
                  htmlFor="login-name"
                  className="block text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]"
                >
                  Full name
                </label>
                <input
                  id="login-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ren Nakamura"
                  className="mt-2 h-12 w-full rounded-xl border border-[var(--input)] bg-[var(--card)] px-4 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]"
              >
                Email
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-2 h-12 w-full rounded-xl border border-[var(--input)] bg-[var(--card)] px-4 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
              />
            </div>

            {mode !== 'reset' && (
              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]"
                  >
                    Password
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => setMode('reset')}
                      className="text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-2 h-12 w-full rounded-xl border border-[var(--input)] bg-[var(--card)] px-4 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
            )}

            <button
              type="submit"
              className="michi-interactive h-12 w-full rounded-full bg-[var(--accent)] text-sm font-bold text-[#141A18] hover:bg-[#ff8c60]"
            >
              {mode === 'signup'
                ? 'Create account →'
                : mode === 'reset'
                  ? 'Send reset link →'
                  : 'Sign in →'}
            </button>

            {mode !== 'reset' && (
              <button
                type="button"
                onClick={() => {
                  signIn('');
                  navigate('/profile');
                }}
                className="michi-interactive h-12 w-full rounded-full border border-[var(--border)] bg-[var(--card)] text-sm font-bold text-[var(--foreground)] hover:border-[var(--accent)]"
              >
                Continue with Google
              </button>
            )}
          </form>

          <p className="mt-8 text-center text-xs text-[var(--muted-foreground)]">
            {mode === 'signin' ? (
              <>
                New to MICHI?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="font-bold text-[var(--foreground)] underline-offset-4 hover:text-[var(--accent)] hover:underline"
                >
                  Create account
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="font-bold text-[var(--foreground)] underline-offset-4 hover:text-[var(--accent)] hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
