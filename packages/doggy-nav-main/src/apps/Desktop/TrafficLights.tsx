import { X, Minus, Maximize2 } from 'lucide-react';

export default function TrafficLights({
  unfocused = false,
  onClose,
  onMinimize,
  onMaximize,
  expandable = true,
}: {
  unfocused?: boolean;
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  expandable?: boolean;
}) {
  const baseBtn =
    'h-3.5 w-3.5 rounded-full shadow-[0_0_0_0.5px_rgba(0,0,0,0.35)] transition-transform duration-100';

  const faded = unfocused ? 'opacity-70' : '';

  return (
    <div className={`grid grid-cols-3 items-center gap-2 h-full select-none ${faded}`}>
      <button
        type="button"
        aria-label="Close"
        onClick={(e) => {
          e.stopPropagation();
          onClose?.();
        }}
        className={`${baseBtn} group bg-[var(--tl-red,#ff5f56)]`}
        title="Close"
      >
        <X className="opacity-0 group-hover:opacity-100 transition-opacity w-2.5 h-2.5 m-auto text-black/70" />
      </button>
      <button
        type="button"
        aria-label="Minimize"
        onClick={(e) => {
          e.stopPropagation();
          onMinimize?.();
        }}
        className={`${baseBtn} group bg-[var(--tl-yellow,#ffbd2e)]`}
        title="Minimize"
      >
        <Minus className="opacity-0 group-hover:opacity-100 transition-opacity w-2.5 h-2.5 m-auto text-black/70" />
      </button>
      <button
        type="button"
        aria-label="Maximize"
        onClick={(e) => {
          e.stopPropagation();
          if (expandable) onMaximize?.();
        }}
        className={`${baseBtn} group bg-[var(--tl-green,#27c93f)]`}
        title="Maximize"
      >
        <Maximize2 className="opacity-0 group-hover:opacity-100 transition-opacity w-2.5 h-2.5 m-auto text-black/70 rotate-90" />
      </button>
    </div>
  );
}
