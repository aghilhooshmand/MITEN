import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type Props = {
  text?: string | null;
  children: ReactNode;
  className?: string;
  side?: "bottom" | "right";
};

export function ExplainTip({ text, children, className, side = "bottom" }: Props) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const tip = tipRef.current;
    const width = Math.min(380, window.innerWidth - 16);
    const height = tip?.offsetHeight ?? 120;
    let left = rect.left;
    let top = rect.bottom + 8;
    if (side === "right" && rect.right + 12 + width < window.innerWidth) {
      left = rect.right + 12;
      top = rect.top;
    } else {
      if (left + width > window.innerWidth - 8) {
        left = window.innerWidth - width - 8;
      }
      left = Math.max(8, left);
      if (top + height > window.innerHeight - 8 && rect.top > height + 16) {
        top = rect.top - height - 8;
      }
    }
    setBox({ left: Math.max(8, left), top: Math.max(8, top) });
  }, [open, text, side]);

  if (!text) return <>{children}</>;

  return (
    <span
      ref={triggerRef}
      className={className}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => {
        setOpen(false);
        setBox(null);
      }}
      onFocus={() => setOpen(true)}
      onBlur={() => {
        setOpen(false);
        setBox(null);
      }}
    >
      {children}
      {open
        ? createPortal(
            <div
              ref={tipRef}
              className="explain-tip"
              role="tooltip"
              style={{
                left: box?.left ?? -9999,
                top: box?.top ?? -9999,
                width: Math.min(380, window.innerWidth - 16),
                visibility: box ? "visible" : "hidden",
              }}
            >
              {text}
            </div>,
            document.body,
          )
        : null}
    </span>
  );
}
