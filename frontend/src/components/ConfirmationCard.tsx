interface ConfirmationCardProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmationCard({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmationCardProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d192b]/70 px-4 backdrop-blur-sm">
      <div className="pv-panel-dark w-full max-w-lg border border-white/10 p-6 sm:p-8">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="pv-kicker text-[#09c184]">Confirmación</p>
            <h3 className="mt-2 text-2xl font-bold text-white">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            aria-label="Cerrar confirmación"
          >
            ×
          </button>
        </div>

        <p className="text-sm leading-6 text-slate-300">{description}</p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={onConfirm}
            disabled={loading}
            className="pv-button-danger flex-1 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Procesando...' : confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="pv-button-secondary flex-1 bg-transparent text-white hover:bg-white/10"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}