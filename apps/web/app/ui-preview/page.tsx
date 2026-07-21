"use client";

// Example route for the @scrum-poker/ui primitives. Not a product route — it
// exists so the design system can be visually verified and so the package's
// Tailwind classes are exercised end-to-end in apps/web. All styling comes from
// the centralized tokens in @scrum-poker/config's preset.
import * as React from "react";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
  Label,
  Separator,
  Spinner,
  Reveal,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Toaster,
  useToast,
} from "@scrum-poker/ui";

function ToastDemo() {
  const { toast } = useToast();
  return (
    <Button
      variant="secondary"
      onClick={() =>
        toast({
          variant: "success",
          title: "Vote recorded",
          description: "Your estimate has been submitted.",
        })
      }
    >
      Show toast
    </Button>
  );
}

export default function UiPreviewPage() {
  const [revealed, setRevealed] = React.useState(false);

  return (
    <Toaster>
      <main className="mx-auto flex max-w-3xl flex-col gap-section px-6 py-12 text-content">
        <header className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">UI primitives</h1>
          <p className="text-muted">
            @scrum-poker/ui — Tailwind + Radix, token-driven.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
            <CardDescription>Variants, sizes and states.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button loading>Saving</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Form field</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Label htmlFor="pin" required>
              Session PIN
            </Label>
            <Input id="pin" placeholder="e.g. 4821" inputMode="numeric" />
            <Separator label="or" className="my-2" />
            <ToastDemo />
          </CardContent>
          <CardFooter>
            <Spinner size="sm" />
            <span className="text-sm text-muted">Loading indicator</span>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reveal (flip)</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <Reveal
              revealed={revealed}
              front={
                <div className="flex size-24 items-center justify-center rounded-card bg-surface-muted text-2xl font-display">
                  ?
                </div>
              }
              back={
                <div className="flex size-24 items-center justify-center rounded-card bg-brand text-2xl font-display text-brand-foreground">
                  8
                </div>
              }
            />
            <Button variant="outline" onClick={() => setRevealed((v) => !v)}>
              {revealed ? "Hide" : "Reveal"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dialog &amp; Table</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Open dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reveal votes?</DialogTitle>
                  <DialogDescription>
                    This will show every participant&apos;s estimate.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="ghost">Cancel</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button>Reveal</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Voter</TableHead>
                  <TableHead>Estimate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow data-selected="true">
                  <TableCell>Ada</TableCell>
                  <TableCell>8</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Linus</TableCell>
                  <TableCell>5</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </Toaster>
  );
}
