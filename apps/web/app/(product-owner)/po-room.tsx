"use client";

/**
 * Product Owner route — client island (estimation management + live stats).
 *
 * Replaces the legacy `src/pages/po-page.tsx` (+ `po-page.scss`) and the
 * PouchDB wiring in `src/components/{estimations,est-statistics,estimation-chart,
 * card-reveal,votes-table,import-zone}`. It is the interactive half of `/po`; the
 * Server Component shell (`po/page.tsx`) loads the initial session graph and hands
 * it in as `initialSession` so first paint is already hydrated with real data.
 *
 * Mirrors the `/dev` island (`dev-room.tsx`) exactly:
 *   1. Live state — subscribe to the SSE stream via `useSessionStream`; on every
 *      `change` event re-fetch the session graph through `getSessionAction` and
 *      replace local state. This is the 1:1 replacement for the legacy PouchDB
 *      `onChange` → `getSession` loop (`this.api.onChange(this.getSession)`):
 *      event → revalidate → render. Incoming developer votes stream in this way,
 *      keeping the reveal / stats / chart live.
 *   2. Management — the reusable `Estimations` component renders the round list +
 *      per-round panel (start / stop-reveal / delete + `EstStatistics`,
 *      `EstimationChart`, `CardReveal`/`VotesTable`). Its callbacks flow to Server
 *      Actions; every write fires `pg_notify` → SSE, which is what switches `/dev`
 *      live when the PO activates a round.
 *   3. Create — a name + description form → `createEstimationAction`.
 *   4. Edit — rename / edit description of the selected round via a `ui` Dialog →
 *      `updateEstimationAction`.
 *   5. Import — `ImportZone` (react-dropzone) parses a CSV client-side and emits
 *      the rows → `importEstimationsAction` (bulk create).
 *   6. Share — a compact "Copy invite link" button (and PIN, if set) in the
 *      session header so the PO can invite developers (their coordination role).
 *
 * Styling is Tailwind tokens via `@scrum-poker/ui` / `@scrum-poker/components`
 * only — no inline styles / SCSS / Semantic UI.
 */

import { Estimations, ImportZone } from "@scrum-poker/components";
import type { Estimation, Session } from "@scrum-poker/types";
import {
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    cn,
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    Input,
    Label,
    Separator,
    Spinner,
    Toaster,
    useToast,
} from "@scrum-poker/ui";
import type { ImportedEstimation } from "@scrum-poker/utils";
import {
    Check,
    Copy,
    Pencil,
    Plus,
    QrCode,
    TriangleAlert,
    Wifi,
    WifiOff,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import QRCode from "react-qr-code";

import { useSessionStream } from "@/lib/client/use-session-stream";
import { sessionHref } from "@/lib/session-route";
import {
    activateEstimationAction,
    createEstimationAction,
    deleteEstimationAction,
    getPublicJoinUrlAction,
    getSessionAction,
    importEstimationsAction,
    updateEstimationAction,
} from "./actions";

/** Shared textarea styling — mirrors the `ui` `Input` tokens (no `Textarea` primitive yet). */
const TEXTAREA_CLASS = cn(
  "flex min-h-20 w-full rounded-input border border-border bg-surface px-3 py-2 text-sm text-content",
  "placeholder:text-muted-foreground shadow-sm transition-colors duration-fast ease-emphasized",
  "outline-none focus-visible:border-border-focus focus-visible:ring-2 focus-visible:ring-ring/40",
  "disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none",
);

/** Small connection indicator — reassures the PO the live stream is up. */
function StreamStatus({
  status,
}: {
  status: ReturnType<typeof useSessionStream>["status"];
}) {
  const live = status === "open";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-medium",
        live ? "bg-success-50 text-success-700" : "bg-surface-muted text-muted",
      )}
      role="status"
      aria-live="polite"
    >
      {live ? (
        <Wifi aria-hidden="true" className="size-3.5" />
      ) : (
        <WifiOff aria-hidden="true" className="size-3.5" />
      )}
      {live ? "Live" : status === "connecting" ? "Connecting…" : "Offline"}
    </span>
  );
}

/** Compact "copy developer invite link" button for the session header. */
function CopyInviteButton({ session }: { session: Session }) {
  const [copied, setCopied] = React.useState(false);
  const devHref = sessionHref("dev", session.id);

  const copy = React.useCallback(async () => {
    try {
      const url =
        typeof window !== "undefined"
          ? `${window.location.origin}${devHref}`
          : devHref;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("copy invite link failed", err);
    }
  }, [devHref]);

  return (
    <Button type="button" variant="outline" size="sm" onClick={copy}>
      {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      {copied ? "Copied" : "Copy invite link"}
    </Button>
  );
}

/**
 * "Public QR invite" button + dialog for the session header. Resolves a
 * temporary public developer-join URL via the ngrok sidecar (see
 * `getPublicJoinUrlAction` / `lib/server/ngrok.ts`) and renders it as a QR
 * code developers outside the local network can scan to join. Exported (not
 * module-private like `CopyInviteButton`) so it's unit-testable in isolation
 * without mounting the full `PoFlow` + SSE session stream.
 */
type QrInviteState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; url: string }
  | { status: "error"; error: string };

export function QrInviteButton({ session }: { session: Session }) {
  const [open, setOpen] = React.useState(false);
  const [state, setState] = React.useState<QrInviteState>({ status: "idle" });
  const [pending, startTransition] = React.useTransition();

  const load = React.useCallback(() => {
    setState({ status: "loading" });
    startTransition(async () => {
      const result = await getPublicJoinUrlAction(session.id);
      setState(
        result.ok
          ? { status: "success", url: result.url }
          : { status: "error", error: result.error },
      );
    });
  }, [session.id]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) load();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <QrCode aria-hidden="true" />
          Public QR invite
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Scan to join from anywhere</DialogTitle>
          <DialogDescription>
            Developers outside your local network can scan this code to join
            &ldquo;{session.name || "this session"}&rdquo; via a temporary
            public link.
          </DialogDescription>
        </DialogHeader>

        {state.status === "idle" || state.status === "loading" ? (
          <div className="flex flex-col items-center gap-2 py-6">
            <Spinner label="Generating public link…" />
            <span className="text-sm text-muted">Generating public link…</span>
          </div>
        ) : state.status === "error" ? (
          <div className="flex flex-col gap-3 py-2">
            <p className="flex items-center gap-2 rounded-card border border-warning-300/60 bg-warning-50 px-4 py-3 text-sm font-medium text-warning-800">
              <TriangleAlert aria-hidden="true" className="size-4 shrink-0" />
              {state.error}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={load}
              disabled={pending}
            >
              Retry
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="rounded-card border border-border bg-white p-3">
              <QRCode value={state.url} size={192} />
            </div>
            {!session.pin ? (
              <p className="flex items-center gap-2 rounded-card border border-warning-300/60 bg-warning-50 px-3 py-2 text-xs font-medium text-warning-800">
                <TriangleAlert aria-hidden="true" className="size-3.5 shrink-0" />
                This session has no PIN — anyone with this link can join.
              </p>
            ) : null}
            <div className="flex w-full items-center gap-2">
              <Input
                readOnly
                value={state.url}
                onFocus={(event) => event.currentTarget.select()}
                aria-label="Public join link"
              />
              <QrCopyButton url={state.url} />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Compact "copy this public URL" button — mirrors `CopyInviteButton`'s pattern. */
function QrCopyButton({ url }: { url: string }) {
  const [copied, setCopied] = React.useState(false);

  const copy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("copy public invite link failed", err);
    }
  }, [url]);

  return (
    <Button type="button" variant="outline" size="sm" onClick={copy}>
      {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      <span className="sr-only">Copy public link</span>
    </Button>
  );
}

/** Create-estimation form (name + description) → `createEstimationAction`. */
/**
 * AddEstimationDialog — a single "＋" entry point for adding rounds, with two
 * tabs: manual entry (name + description → `createEstimationAction`) and CSV
 * import (`ImportZone` → `importEstimationsAction`). Replaces the two separate
 * always-visible cards, reclaiming vertical space on the PO workspace. Closes
 * itself once a round is added or a CSV is imported.
 */
function AddEstimationDialog({
  open,
  onOpenChange,
  onCreate,
  onImport,
  onImportError,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (input: { name: string; description: string }) => Promise<boolean>;
  onImport: (rows: ImportedEstimation[]) => Promise<void>;
  onImportError: (message: string) => void;
}) {
  const [tab, setTab] = React.useState<"manual" | "csv">("manual");
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  // Reset to a clean manual tab each time the dialog opens.
  React.useEffect(() => {
    if (open) {
      setTab("manual");
      setName("");
      setDescription("");
      setSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    const ok = await onCreate({ name, description });
    setSubmitting(false);
    if (ok) onOpenChange(false);
  };

  const handleImport = async (rows: ImportedEstimation[]) => {
    await onImport(rows);
    onOpenChange(false);
  };

  const tabButton = (id: "manual" | "csv", label: string) => (
    <button
      type="button"
      role="tab"
      id={`add-est-tab-${id}`}
      aria-selected={tab === id}
      aria-controls={`add-est-panel-${id}`}
      onClick={() => setTab(id)}
      className={cn(
        "flex-1 rounded-button px-3 py-1.5 text-sm font-medium",
        "transition-colors duration-fast ease-emphasized motion-reduce:transition-none",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        tab === id
          ? "bg-surface text-content shadow-card"
          : "text-content-subtle hover:text-content",
      )}
    >
      {label}
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add an estimation</DialogTitle>
          <DialogDescription>
            Add a single round manually, or import several from a CSV file.
          </DialogDescription>
        </DialogHeader>

        <div
          role="tablist"
          aria-label="Add estimation method"
          className="flex gap-1 rounded-button bg-surface-muted p-1"
        >
          {tabButton("manual", "Add manually")}
          {tabButton("csv", "Import from CSV")}
        </div>

        {tab === "manual" ? (
          <form
            id="add-est-panel-manual"
            role="tabpanel"
            aria-labelledby="add-est-tab-manual"
            className="flex flex-col gap-3"
            onSubmit={handleSubmit}
          >
            <div className="flex flex-col gap-1">
              <Label htmlFor="po-est-name">Story name</Label>
              <Input
                id="po-est-name"
                name="name"
                required
                placeholder="e.g. PROJ-123 — Login page"
                value={name}
                onChange={(event) => setName(event.currentTarget.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="po-est-description">Description (optional)</Label>
              <textarea
                id="po-est-description"
                name="description"
                rows={3}
                placeholder="Story description"
                className={TEXTAREA_CLASS}
                value={description}
                onChange={(event) =>
                  setDescription(event.currentTarget.value)
                }
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={!name.trim() || submitting}>
                <Plus aria-hidden="true" />
                {submitting ? "Adding…" : "Add estimation"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div
            id="add-est-panel-csv"
            role="tabpanel"
            aria-labelledby="add-est-tab-csv"
          >
            <ImportZone onImport={handleImport} onError={onImportError} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Rename / edit-description dialog for the selected estimation → `updateEstimationAction`. */
function EditEstimationDialog({
  estimation,
  open,
  onOpenChange,
  onSave,
}: {
  estimation: Estimation | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (input: { name: string; description: string }) => Promise<boolean>;
}) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  // Seed the fields from the estimation each time the dialog opens.
  React.useEffect(() => {
    if (open && estimation) {
      setName(estimation.name ?? "");
      setDescription(estimation.description ?? "");
    }
  }, [open, estimation]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    const ok = await onSave({ name, description });
    setSubmitting(false);
    if (ok) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit estimation</DialogTitle>
          <DialogDescription>
            Rename this round or update its description.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1">
            <Label htmlFor="po-edit-name">Story name</Label>
            <Input
              id="po-edit-name"
              required
              value={name}
              onChange={(event) => setName(event.currentTarget.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="po-edit-description">Description</Label>
            <textarea
              id="po-edit-description"
              rows={3}
              className={TEXTAREA_CLASS}
              value={description}
              onChange={(event) => setDescription(event.currentTarget.value)}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!name.trim() || submitting}>
              {submitting ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PoFlow({
  sessionId,
  initialSession,
}: {
  sessionId: string;
  initialSession: Session;
}) {
  const { toast } = useToast();

  // Live session state, seeded from the server-rendered graph (no flash).
  const [session, setSession] = React.useState<Session | null>(initialSession);

  // Controlled selection so the edit dialog can target a specific round.
  const [selectedId, setSelectedId] = React.useState<string | undefined>(
    () =>
      initialSession.estimations?.find((e) => e.isActive)?.id ??
      initialSession.estimations?.[0]?.id,
  );
  const [editingOpen, setEditingOpen] = React.useState(false);
  const [addingOpen, setAddingOpen] = React.useState(false);
  const [announce, setAnnounce] = React.useState("");

  const estimations = session?.estimations ?? [];
  const selected =
    estimations.find((e) => e.id === selectedId) ?? estimations[0];

  // ── Live updates: revalidate the session on every SSE change event ──────────
  const revalidate = React.useCallback(async () => {
    try {
      const fresh = await getSessionAction(sessionId);
      setSession(fresh);
    } catch (err) {
      // Transient failure — the next event (or reconnect) will retry.
      console.error("po revalidate failed", err);
    }
  }, [sessionId]);

  const { status } = useSessionStream(sessionId, {
    enabled: Boolean(session),
    onChange: () => {
      void revalidate();
    },
  });

  // Keep a valid selection when the list changes (e.g. after import/delete).
  React.useEffect(() => {
    if (estimations.length === 0) {
      if (selectedId !== undefined) setSelectedId(undefined);
      return;
    }
    if (!estimations.some((e) => e.id === selectedId)) {
      setSelectedId(estimations[0]?.id);
    }
  }, [estimations, selectedId]);

  const toastError = React.useCallback(
    (title: string, error: string) => {
      toast({ variant: "danger", title, description: error });
    },
    [toast],
  );

  const handleCreate = React.useCallback(
    async (input: { name: string; description: string }) => {
      const result = await createEstimationAction(sessionId, input);
      if (result.ok) {
        setSelectedId(result.data.id);
        setAnnounce(`Estimation “${result.data.name}” added.`);
        return true;
      }
      toastError("Couldn't add estimation", result.error);
      return false;
    },
    [sessionId, toastError],
  );

  const handleEdit = React.useCallback(
    async (input: { name: string; description: string }) => {
      if (!selected) return false;
      const result = await updateEstimationAction(selected.id, {
        name: input.name,
        description: input.description,
      });
      if (result.ok) {
        setAnnounce(`Estimation “${result.data.name}” updated.`);
        return true;
      }
      toastError("Couldn't update estimation", result.error);
      return false;
    },
    [selected, toastError],
  );

  const handleStart = React.useCallback(
    async (estimation: Estimation) => {
      const result = await activateEstimationAction(sessionId, estimation.id);
      if (result.ok) {
        setAnnounce(`Voting started on “${estimation.name}”.`);
      } else {
        toastError("Couldn't start estimation", result.error);
      }
    },
    [sessionId, toastError],
  );

  const handleStop = React.useCallback(
    async (estimation: Estimation) => {
      const result = await updateEstimationAction(estimation.id, {
        isEnded: true,
      });
      if (result.ok) {
        setAnnounce(`Votes revealed for “${estimation.name}”.`);
      } else {
        toastError("Couldn't reveal votes", result.error);
      }
    },
    [toastError],
  );

  const handleDelete = React.useCallback(
    async (estimation: Estimation) => {
      const result = await deleteEstimationAction(estimation.id);
      if (result.ok) {
        setAnnounce(`Estimation “${estimation.name}” deleted.`);
      } else {
        toastError("Couldn't delete estimation", result.error);
      }
    },
    [toastError],
  );

  const handleImport = React.useCallback(
    async (rows: ImportedEstimation[]) => {
      const result = await importEstimationsAction(sessionId, rows);
      if (result.ok) {
        setAnnounce(`Imported ${result.data.length} estimation(s).`);
        toast({
          title: "Import complete",
          description: `Added ${result.data.length} estimation(s).`,
        });
      } else {
        toastError("Import failed", result.error);
      }
    },
    [sessionId, toast, toastError],
  );

  // The session was deleted out from under us (revalidate returned null).
  if (!session) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center gap-3 py-section text-center">
          <p className="text-base font-medium text-content">
            This session is no longer available.
          </p>
          <Button asChild variant="outline">
            <Link href="/">&larr; Back to start</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const sessionName = session.name || "Untitled session";

  return (
    <div className="flex flex-col gap-section">
      {/* Session header + invite + live status — compact coordination bar. */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-surface-muted px-4 py-3">
        <div className="flex min-w-0 flex-col">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            Session
          </span>
          <span className="truncate text-base font-semibold text-content">
            {sessionName}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {session.pin ? (
            <span className="inline-flex items-center gap-1.5 text-sm text-muted">
              <span className="text-xs font-medium uppercase tracking-wide">
                PIN
              </span>
              <span className="font-mono text-content">{session.pin}</span>
            </span>
          ) : null}
          <CopyInviteButton session={session} />
          <QrInviteButton session={session} />
          <StreamStatus status={status} />
        </div>
      </div>

      {/* Estimation list + management panel (stats / chart / reveal) — the
          primary PO workspace, kept high on the page for quick access. */}
      <Card className="w-full">
        <CardHeader className="flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">Estimations</CardTitle>
          <div className="flex items-center gap-1">
            {selected ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditingOpen(true)}
              >
                <Pencil aria-hidden="true" />
                Edit
              </Button>
            ) : null}
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setAddingOpen(true)}
            >
              <Plus aria-hidden="true" />
              Add
            </Button>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-card">
          <Estimations
            estimations={estimations}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onStart={handleStart}
            onStop={handleStop}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      <AddEstimationDialog
        open={addingOpen}
        onOpenChange={setAddingOpen}
        onCreate={handleCreate}
        onImport={handleImport}
        onImportError={(message) => toastError("Couldn't read CSV", message)}
      />

      <EditEstimationDialog
        estimation={selected}
        open={editingOpen}
        onOpenChange={setEditingOpen}
        onSave={handleEdit}
      />

      {/* Polite live region announcing state changes to assistive tech. */}
      <p className="sr-only" role="status" aria-live="polite">
        {announce}
      </p>

      <Link
        href="/"
        className="text-sm text-brand underline-offset-4 hover:underline"
      >
        &larr; Back to start
      </Link>
    </div>
  );
}

/** Public island — wraps the flow in the Toast provider (error notifications). */
export function PoRoom(props: { sessionId: string; initialSession: Session }) {
  return (
    <Toaster>
      <PoFlow {...props} />
    </Toaster>
  );
}
