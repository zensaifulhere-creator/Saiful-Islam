import { useRef } from 'react';
import { useSegmentedSpring } from '../hooks/useSpringPhysics';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface LiquidSegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  size?: 'sm' | 'md';
  roleType?: 'tablist' | 'group';
  className?: string;
}

export function LiquidSegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  size = 'md',
  roleType = 'group',
  className = '',
}: LiquidSegmentedControlProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const activeIdx = Math.max(
    0,
    options.findIndex((o) => o.value === value)
  );

  const { thumbRef, shadowRef } = useSegmentedSpring(
    containerRef,
    buttonRefs,
    activeIdx,
    options.length,
    {
      stiffness: 410,
      damping: 27,
      mass: 0.8,
      maxStretch: 0.13,
      verticalLift: 1.2,
    }
  );

  const paddingClasses = size === 'sm' ? 'p-0.5' : 'p-1';
  const btnPaddingClasses =
    size === 'sm'
      ? 'px-3 py-1 text-[11px]'
      : 'px-3.5 py-1.5 text-xs';

  return (
    <div
      ref={containerRef}
      role={roleType}
      aria-label={ariaLabel}
      className={`liquid-glass relative inline-flex flex-nowrap items-center gap-0.5 rounded-full overflow-x-auto no-scrollbar max-w-full ${paddingClasses} ${className}`}
    >
      {/* Dynamic GPU Cast Shadow Layer */}
      <span
        ref={shadowRef}
        aria-hidden="true"
        className={`liquid-segment-shadow pointer-events-none absolute left-0 rounded-full ${
          size === 'sm' ? 'top-0.5 bottom-0.5' : 'top-1 bottom-1'
        }`}
      />

      {/* Spring-Propelled Velocity-Squish Active Thumb */}
      <span
        ref={thumbRef}
        aria-hidden="true"
        className={`liquid-segment-thumb pointer-events-none absolute left-0 rounded-full ${
          size === 'sm' ? 'top-0.5 bottom-0.5' : 'top-1 bottom-1'
        }`}
      />

      {options.map((opt, idx) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            ref={(el) => {
              buttonRefs.current[idx] = el;
            }}
            type="button"
            role={roleType === 'tablist' ? 'tab' : undefined}
            aria-selected={roleType === 'tablist' ? isSelected : undefined}
            aria-pressed={roleType === 'group' ? isSelected : undefined}
            onClick={() => onChange(opt.value)}
            className={`relative z-10 rounded-full font-semibold transition-colors duration-200 whitespace-nowrap shrink-0 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-[#2E586D] ${btnPaddingClasses} ${
              isSelected
                ? 'text-white'
                : 'text-[#1A2B36]/85 hover:text-[#1A2B36]'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
