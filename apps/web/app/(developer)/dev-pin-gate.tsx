"use client";

/**
 * DevPinGate — the developer join gate shown on `/dev?session=<id>` when the
 * session has a PIN and this browser hasn't unlocked it yet. It collects the
 * PIN, verifies it via `verifySessionPinAction` (which sets an httpOnly unlock
 * cookie on success), then refreshes the route so the server component loads
 * the real session graph and mounts the voting room.
 *
 * The session graph (estimations/votes) and the PIN are never sent to the
 * browser until the gate passes — only the session name is shown for context.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@scrum-poker/ui";
import { KeyRound, LogIn } from "lucide-react";

import { verifySessionPinAction } from "./actions";

export function DevPinGate({
  sessionId,
  sessionName,
}: {
  sessionId: string;
  sessionName: string | null;
}) {
  const router = useRouter();
  const [pin, setPin] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!pin.trim()) {
      setError("Enter the session PIN to join.");
      return;
    }
    startTransition(async () => {
      const result = await verifySessionPinAction(sessionId, pin);
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound aria-hidden="true" className="size-5 text-brand" />
          Enter session PIN
        </CardTitle>
        <CardDescription>
          {sessionName ? (
            <>
              &ldquo;{sessionName}&rdquo; is protected. Enter the PIN your
              Product Owner shared to join.
            </>
          ) : (
            <>
              This session is protected. Enter the PIN your Product Owner shared
              to join.
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dev-join-pin" required>
              Session PIN
            </Label>
            <Input
              id="dev-join-pin"
              name="pin"
              inputMode="numeric"
              autoComplete="off"
              autoFocus
              placeholder="e.g. 1234"
              invalid={Boolean(error)}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
            />
          </div>
          {error ? (
            <p
              role="alert"
              className="rounded-input border border-danger/40 bg-danger-50 px-3 py-2 text-sm text-danger-700"
            >
              {error}
            </p>
          ) : null}
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/"
              className="text-sm text-brand underline-offset-4 hover:underline"
            >
              &larr; Back to start
            </Link>
            <Button type="submit" loading={pending}>
              <LogIn aria-hidden="true" />
              Join session
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
