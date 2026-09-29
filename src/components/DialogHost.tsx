import React, { useEffect, useRef, useSyncExternalStore } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, Trash2 } from 'lucide-react';
import { closeDialog, getActiveDialog, subscribeDialog, DialogVariant } from '../utils/dialog';

const VARIANT_STYLE: Record<DialogVariant, { ring: string; icon: string; button: string; bar: string }> = {
  success: { ring: 'bg-green-100', icon: 'text-green-600', button: 'bg-green-700 hover:bg-green-800', bar: 'bg-green-600' },
  error: { ring: 'bg-red-100', icon: 'text-red-600', button: 'bg-red-600 hover:bg-red-700', bar: 'bg-red-500' },
  warning: { ring: 'bg-amber-100', icon: 'text-amber-600', button: 'bg-amber-500 hover:bg-amber-600', bar: 'bg-amber-500' },
  info: { ring: 'bg-blue-100', icon: 'text-blue-600', button: 'bg-blue-600 hover:bg-blue-700', bar: 'bg-blue-500' }
};

const VARIANT_ICON: Record<DialogVariant, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info
};

export default function DialogHost() {
  const item = useSyncExternalStore(subscribeDialog, getActiveDialog, getActiveDialog);
  const panelRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);

  // Kunci scroll halaman selama popup tampil.
  useEffect(() => {
    if (!item) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [item?.id]);

  // Fokus ke tombol utama + kembalikan fokus ke elemen sebelumnya saat popup ditutup.
  useEffect(() => {
    if (!item) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    primaryRef.current?.focus();
    return () => {
      previouslyFocused?.focus?.();
    };
  }, [item?.id]);

  // Tutup otomatis untuk popup sukses.
  useEffect(() => {
    if (!item || item.kind !== 'notify' || item.autoCloseMs <= 0) return;
    const timer = setTimeout(() => closeDialog(item.id), item.autoCloseMs);
    return () => clearTimeout(timer);
  }, [item?.id]);

  // Keyboard: Esc = tutup/batal, Tab dikunci di dalam popup.
  useEffect(() => {
    if (!item) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeDialog(item.id, false);
        return;
      }
      if (e.key === 'Tab' && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled])');
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [item?.id]);

  if (!item) return null;

  const variant: DialogVariant = item.kind === 'notify' ? item.variant : item.danger ? 'error' : 'warning';
  const style = VARIANT_STYLE[variant];
  const Icon = item.kind === 'confirm' && item.danger ? Trash2 : VARIANT_ICON[variant];
  const titleId = `dialog-title-${item.id}`;
  const descId = `dialog-desc-${item.id}`;

  return (
    <div
      className="dialog-overlay fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeDialog(item.id, false);
      }}
    >
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="dialog-panel relative w-full max-w-sm overflow-hidden rounded-3xl bg-white p-6 text-center shadow-2xl"
      >
        <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${style.ring}`}>
          <Icon className={`h-7 w-7 ${style.icon}`} />
        </div>

        <h3 id={titleId} className="mb-1.5 text-lg font-extrabold text-gray-900">
          {item.title}
        </h3>
        <p id={descId} className="mb-6 whitespace-pre-line break-words text-sm leading-relaxed text-gray-600">
          {item.message}
        </p>

        {item.kind === 'confirm' ? (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => closeDialog(item.id, false)}
              className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50 cursor-pointer"
            >
              {item.cancelText}
            </button>
            <button
              type="button"
              ref={primaryRef}
              onClick={() => closeDialog(item.id, true)}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-sm transition cursor-pointer ${
                item.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-green-700 hover:bg-green-800'
              }`}
            >
              {item.confirmText}
            </button>
          </div>
        ) : (
          <button
            type="button"
            ref={primaryRef}
            onClick={() => closeDialog(item.id)}
            className={`w-full rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-sm transition cursor-pointer ${style.button}`}
          >
            {item.variant === 'success' ? 'OK' : 'Mengerti'}
          </button>
        )}

        {item.kind === 'notify' && item.autoCloseMs > 0 && (
          <div className="absolute bottom-0 left-0 h-1 w-full bg-gray-100">
            <div
              key={item.id}
              className={`dialog-progress h-full ${style.bar}`}
              style={{ animationDuration: `${item.autoCloseMs}ms` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
