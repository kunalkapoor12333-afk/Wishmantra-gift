import { useEffect, useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Lock } from 'lucide-react';
import {
  checkAdminSessionStatus,
  loginAdmin,
  setupAdminPasscode,
} from '../../utils/api';

interface AdminLoginProps {
  onSuccess: () => void;
  onBackToStore: () => void;
}

export function AdminLogin({ onSuccess, onBackToStore }: AdminLoginProps) {
  const [setupRequired, setSetupRequired] = useState(false);
  const [checkingMode, setCheckingMode] = useState(true);
  const [passcode, setPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    checkAdminSessionStatus()
      .then((status) => {
        if (!active) return;
        if (status.authenticated) {
          onSuccess();
          return;
        }
        setSetupRequired(status.setupRequired);
      })
      .finally(() => {
        if (active) setCheckingMode(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = passcode.trim();
    if (!trimmed) {
      setError('Please enter the studio passcode.');
      return;
    }

    if (setupRequired) {
      if (trimmed.length < 6) {
        setError('Passcode must be at least 6 characters.');
        return;
      }
      if (trimmed !== confirmPasscode.trim()) {
        setError('Passcodes do not match.');
        return;
      }
    }

    setError(null);
    setSubmitting(true);
    try {
      if (setupRequired) {
        await setupAdminPasscode(trimmed);
      } else {
        await loginAdmin(trimmed);
      }
      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to sign in.';
      setError(msg);
      if (msg.toLowerCase().includes('setup required')) {
        setSetupRequired(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F9] flex flex-col justify-center items-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl border border-[#F2E2E8] shadow-[0_6px_24px_rgba(35,25,29,0.05)] p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={onBackToStore}
            className="inline-flex items-center gap-1.5 min-h-[36px] text-xs font-medium text-slate-600 hover:text-[#D63B70] cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Storefront</span>
          </button>
          <span className="text-xs font-medium text-[#D63B70]">
            WishMantra Admin
          </span>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#FDF2F6] border border-[#F7D8E4] text-[#D63B70] flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-slate-900">
              {setupRequired ? 'Set Admin Passcode' : 'Admin Dashboard'}
            </h1>
          </div>
        </div>
        <p className="text-sm text-slate-500 mb-6">
          {setupRequired
            ? 'Create your studio admin passcode once to protect WishMantra orders, inventory, enquiries, and store settings.'
            : 'Sign in to manage WishMantra orders, inventory, enquiries, and store settings.'}
        </p>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label
              htmlFor="admin-passcode-input"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              {setupRequired ? 'New Studio Passcode (min 6 chars)' : 'Studio Passcode'}
            </label>
            <div className="relative">
              <input
                id="admin-passcode-input"
                type={showPasscode ? 'text' : 'password'}
                autoComplete={setupRequired ? 'new-password' : 'current-password'}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                disabled={checkingMode}
                placeholder={setupRequired ? 'Create a secure passcode' : 'Enter admin passcode'}
                className="w-full min-h-[44px] pl-3.5 pr-11 py-2.5 text-base sm:text-sm bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#D63B70]"
              />
              <button
                type="button"
                onClick={() => setShowPasscode((prev) => !prev)}
                aria-label={showPasscode ? 'Hide passcode' : 'Show passcode'}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 min-w-[36px] min-h-[36px] inline-flex items-center justify-center rounded-md text-slate-400 hover:text-slate-800 cursor-pointer"
              >
                {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {setupRequired && (
            <div>
              <label
                htmlFor="admin-passcode-confirm"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Confirm Passcode
              </label>
              <input
                id="admin-passcode-confirm"
                type={showPasscode ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPasscode}
                onChange={(e) => setConfirmPasscode(e.target.value)}
                placeholder="Re-enter passcode"
                className="w-full min-h-[44px] px-3.5 py-2.5 text-base sm:text-sm bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#D63B70]"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || checkingMode}
            className="w-full min-h-[46px] py-2.5 px-4 rounded-xl bg-[#D63B70] text-white text-sm font-semibold hover:bg-[#BE2D5E] transition-colors cursor-pointer disabled:opacity-60"
          >
            {checkingMode
              ? 'Checking studio access...'
              : submitting
                ? setupRequired
                  ? 'Saving passcode...'
                  : 'Signing in...'
                : setupRequired
                  ? 'Save Passcode & Open Admin'
                  : 'Sign In to Admin Panel'}
          </button>
        </form>

        <p className="mt-5 pt-4 border-t border-slate-100 text-xs text-slate-500">
          {setupRequired
            ? 'You can also override this passcode anytime by setting ADMIN_PASSCODE in Settings → Secrets.'
            : 'Access restricted to authorised WishMantra gallery staff.'}
        </p>
      </div>
    </div>
  );
}
