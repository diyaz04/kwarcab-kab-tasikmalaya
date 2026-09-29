// Sistem popup terpusat (pengganti alert / confirm / toast bawaan browser).
// Dipakai dari komponen mana pun tanpa prop drilling:
//
//   notify.success('Berita berhasil dihapus');
//   notify.error('Gagal menyimpan');
//   if (!(await confirmDialog({ message: 'Yakin hapus?', danger: true }))) return;
//
// Popup dirender oleh <DialogHost /> yang dipasang sekali di main.tsx.

export type DialogVariant = 'success' | 'error' | 'warning' | 'info';

export interface NotifyItem {
  kind: 'notify';
  id: number;
  variant: DialogVariant;
  title: string;
  message: string;
  autoCloseMs: number; // 0 = tutup manual
}

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

export interface ConfirmItem {
  kind: 'confirm';
  id: number;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  danger: boolean;
  resolve: (value: boolean) => void;
}

export type DialogItem = NotifyItem | ConfirmItem;

const DEFAULT_TITLES: Record<DialogVariant, string> = {
  success: 'Berhasil',
  error: 'Terjadi Kesalahan',
  warning: 'Perhatian',
  info: 'Informasi'
};

let queue: DialogItem[] = [];
let seq = 0;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((fn) => fn());

export const subscribeDialog = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

// Popup yang sedang tampil = item pertama antrean (referensi stabil selama antrean tidak berubah).
export const getActiveDialog = (): DialogItem | null => queue[0] ?? null;

const push = (item: DialogItem) => {
  queue = [...queue, item];
  emit();
};

const show = (variant: DialogVariant, message: string, title?: string, autoCloseMs?: number) => {
  const text = String(message ?? '').trim();
  if (!text) return;

  // Cegah popup kembar beruntun (mis. klik ganda memicu pesan yang sama).
  const duplicate = queue.some(
    (q) => q.kind === 'notify' && q.variant === variant && q.message === text
  );
  if (duplicate) return;

  push({
    kind: 'notify',
    id: ++seq,
    variant,
    title: title || DEFAULT_TITLES[variant],
    message: text,
    autoCloseMs: autoCloseMs ?? (variant === 'success' ? 2600 : 0)
  });
};

export const notify = {
  success: (message: string, title?: string) => show('success', message, title),
  error: (message: string, title?: string) => show('error', message, title),
  warning: (message: string, title?: string) => show('warning', message, title),
  info: (message: string, title?: string) => show('info', message, title)
};

export const confirmDialog = (options: ConfirmOptions): Promise<boolean> =>
  new Promise<boolean>((resolve) => {
    push({
      kind: 'confirm',
      id: ++seq,
      title: options.title || 'Konfirmasi',
      message: options.message,
      confirmText: options.confirmText || (options.danger ? 'Ya, Hapus' : 'Ya'),
      cancelText: options.cancelText || 'Batal',
      danger: Boolean(options.danger),
      resolve
    });
  });

// Tutup popup. Untuk konfirmasi, `result` menentukan hasil promise (default: batal).
export const closeDialog = (id: number, result = false) => {
  const item = queue.find((q) => q.id === id);
  if (!item) return;
  queue = queue.filter((q) => q.id !== id);
  if (item.kind === 'confirm') item.resolve(result);
  emit();
};
