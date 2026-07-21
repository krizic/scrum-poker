"use client";

import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from "lucide-react";
import { cn } from "../lib/cn";

export type ToastVariant = "default" | "success" | "danger" | "warning";

const variantStyles: Record<ToastVariant, string> = {
  default: "border-border bg-surface text-content",
  success: "border-brand-200 bg-brand-50 text-brand-800",
  danger: "border-danger-200 bg-danger-50 text-danger-700",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
};

const variantIcon: Record<ToastVariant, React.ReactNode> = {
  default: <Info className="size-5 text-muted" aria-hidden="true" />,
  success: <CheckCircle2 className="size-5 text-brand" aria-hidden="true" />,
  danger: <XCircle className="size-5 text-danger" aria-hidden="true" />,
  warning: <TriangleAlert className="size-5 text-amber-500" aria-hidden="true" />,
};

/* ---------------------------------------------------------------------------
 * Styled Radix primitives (accessible: ARIA live region, swipe/Escape close).
 * ------------------------------------------------------------------------- */

export const ToastProvider = ToastPrimitive.Provider;

export const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(function ToastViewport({ className, ...props }, ref) {
  return (
    <ToastPrimitive.Viewport
      ref={ref}
      className={cn(
        "fixed bottom-0 right-0 z-50 flex max-h-screen w-full flex-col gap-2 p-4 sm:max-w-sm",
        className,
      )}
      {...props}
    />
  );
});

export interface ToastRootProps
  extends React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> {
  variant?: ToastVariant;
}

export const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Root>,
  ToastRootProps
>(function Toast({ className, variant = "default", ...props }, ref) {
  return (
    <ToastPrimitive.Root
      ref={ref}
      className={cn(
        "group pointer-events-auto relative flex items-start gap-3 rounded-card border p-4 shadow-elevated",
        "data-[state=open]:animate-toast-in data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]",
        "data-[swipe=cancel]:translate-x-0 data-[state=closed]:opacity-0 motion-reduce:animate-none",
        "transition-opacity duration-fast",
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
});

export const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(function ToastTitle({ className, ...props }, ref) {
  return (
    <ToastPrimitive.Title
      ref={ref}
      className={cn("text-sm font-semibold leading-tight", className)}
      {...props}
    />
  );
});

export const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(function ToastDescription({ className, ...props }, ref) {
  return (
    <ToastPrimitive.Description
      ref={ref}
      className={cn("text-sm opacity-90", className)}
      {...props}
    />
  );
});

export const ToastAction = ToastPrimitive.Action;

export const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(function ToastClose({ className, ...props }, ref) {
  return (
    <ToastPrimitive.Close
      ref={ref}
      aria-label="Close"
      className={cn(
        "absolute right-2 top-2 inline-flex size-6 items-center justify-center rounded-button",
        "text-muted opacity-70 transition-opacity duration-fast hover:opacity-100",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none",
        className,
      )}
      {...props}
    >
      <X className="size-4" aria-hidden="true" />
    </ToastPrimitive.Close>
  );
});

/* ---------------------------------------------------------------------------
 * Lightweight imperative API — a drop-in replacement for react-toastify.
 * Wrap the app once in <Toaster/> and call `toast()` from the returned hook.
 * ------------------------------------------------------------------------- */

export interface ToastOptions {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: ToastVariant;
  /** Auto-dismiss delay in ms; `Infinity` keeps it until closed. */
  duration?: number;
}

interface ToastEntry extends ToastOptions {
  id: string;
  open: boolean;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

/** Access the imperative `toast()` / `dismiss()` API. Requires <Toaster/>. */
export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within <Toaster/>");
  }
  return ctx;
}

export interface ToasterProps {
  children?: React.ReactNode;
  /** Default auto-dismiss duration (ms). */
  duration?: number;
}

/**
 * Toaster — provider + viewport. Mount once near the app root, then trigger
 * notifications with `useToast().toast(...)`.
 */
export function Toaster({ children, duration = 5000 }: ToasterProps) {
  const [toasts, setToasts] = React.useState<ToastEntry[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, open: false } : t)),
    );
  }, []);

  const toast = React.useCallback((options: ToastOptions) => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...options, id, open: true }]);
    return id;
  }, []);

  const value = React.useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      <ToastProvider duration={duration} swipeDirection="right">
        {children}
        {toasts.map(({ id, open, title, description, variant = "default", duration: d }) => (
          <Toast
            key={id}
            variant={variant}
            open={open}
            duration={d}
            onOpenChange={(isOpen) => {
              if (!isOpen) dismiss(id);
            }}
          >
            <span className="mt-0.5 shrink-0">{variantIcon[variant]}</span>
            <div className="grid gap-1 pr-6">
              {title ? <ToastTitle>{title}</ToastTitle> : null}
              {description ? (
                <ToastDescription>{description}</ToastDescription>
              ) : null}
            </div>
            <ToastClose />
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>
    </ToastContext.Provider>
  );
}
