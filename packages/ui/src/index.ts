// @scrum-poker/ui — Tailwind + Radix UI primitives.
//
// Low-level, composable, accessible building blocks styled exclusively with
// Tailwind utilities that reference the centralized theme tokens defined in
// @scrum-poker/config's Tailwind preset. App-specific composed components
// (poker-card, votes-table, …) live in packages/components, not here.

export { cn } from "./lib/cn";

export {
  Button,
  type ButtonProps,
  type ButtonVariant,
  type ButtonSize,
} from "./components/button";

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  type CardProps,
} from "./components/card";

export { Input, type InputProps } from "./components/input";
export { Label, type LabelProps } from "./components/label";

export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  type DialogContentProps,
} from "./components/dialog";

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "./components/table";

export { Separator, type SeparatorProps } from "./components/separator";

export { Reveal, type RevealProps } from "./components/reveal";

export { Spinner, type SpinnerProps } from "./components/spinner";

export {
  Toaster,
  useToast,
  Toast,
  ToastProvider,
  ToastViewport,
  ToastTitle,
  ToastDescription,
  ToastAction,
  ToastClose,
  type ToastOptions,
  type ToastVariant,
  type ToasterProps,
  type ToastRootProps,
} from "./components/toast";
