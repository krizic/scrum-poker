"use client";

import * as React from "react";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
  Label,
  cn,
} from "@scrum-poker/ui";
import { User, Mail, Palette, LogIn } from "lucide-react";
import type { UserInfo } from "@scrum-poker/types";
import { PokerCard } from "../poker-card/poker-card";
import { PATTERN_OPTIONS, DEFAULT_PATTERN } from "../lib/deck";

export interface DevSignInProps {
  /** Emitted with the completed identity when the form is submitted. */
  onSignIn: (userInfo: UserInfo) => void;
  /** Optional seed values (e.g. a previously stored identity). */
  defaultValues?: Partial<UserInfo>;
  className?: string;
}

/**
 * DevSignIn — the lightweight identity form (username + email + card pattern)
 * that produces a `UserInfo`, rebuilt on `@scrum-poker/ui` Input/Button/Label.
 * A live PokerCard preview mirrors the entered details. On submit it emits the
 * identity via `onSignIn` (persisting it is the route's job); a client id is
 * generated with the Web Crypto API to avoid a `uuid` dependency.
 */
export function DevSignIn({
  onSignIn,
  defaultValues,
  className,
}: DevSignInProps) {
  const [username, setUsername] = React.useState(
    defaultValues?.username ?? "",
  );
  const [email, setEmail] = React.useState(defaultValues?.email ?? "");
  const [pattern, setPattern] = React.useState(
    defaultValues?.pattern ?? DEFAULT_PATTERN,
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSignIn({
      id: defaultValues?.id ?? crypto.randomUUID(),
      username: username.trim(),
      email: email.trim(),
      pattern,
    });
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>Developer info</CardTitle>
        <CardDescription>
          Tell us who’s voting — it’s only stored on your device.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-section pt-0 md:grid-cols-[1fr_auto] md:items-start">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dev-username" required>
              Username
            </Label>
            <div className="relative">
              <User
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
              />
              <Input
                id="dev-username"
                name="username"
                required
                autoComplete="username"
                placeholder="Ada Lovelace"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dev-email">Email</Label>
            <div className="relative">
              <Mail
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
              />
              <Input
                id="dev-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="ada@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
              />
            </div>
            <p className="text-xs text-muted">
              Used for your Gravatar avatar.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dev-pattern">Card pattern</Label>
            <div className="relative">
              <Palette
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
              />
              <select
                id="dev-pattern"
                name="pattern"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                className={cn(
                  "h-10 w-full appearance-none rounded-input border border-border bg-surface pl-9 pr-3 text-sm text-content shadow-sm",
                  "outline-none transition-colors duration-fast ease-emphasized motion-reduce:transition-none",
                  "focus-visible:border-border-focus focus-visible:ring-2 focus-visible:ring-ring/40",
                )}
              >
                {PATTERN_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button type="submit" className="mt-2 self-start">
            <LogIn aria-hidden="true" />
            Join session
          </Button>
        </form>

        <div className="flex flex-col items-center gap-2 justify-self-center">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            Your card
          </span>
          <PokerCard
            side="back"
            withProfilePic
            voterPattern={pattern}
            voterUsername={username || "Unknown"}
            voterEmail={email}
          >
            {username || "Unknown"}
          </PokerCard>
        </div>
      </CardContent>
    </Card>
  );
}
