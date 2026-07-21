import { describe, expect, it } from "vitest";

import { toVoteIdentity } from "./user-info";

describe("toVoteIdentity — client identity → Vote fields", () => {
  it("maps a complete UserInfo onto the Vote identity columns", () => {
    expect(
      toVoteIdentity({
        id: "user-1",
        username: "Ada",
        email: "ada@example.com",
        pattern: "retro",
      }),
    ).toEqual({
      voterId: "user-1",
      voterName: "Ada",
      voterEmail: "ada@example.com",
      pattern: "retro",
    });
  });

  it("defaults missing display fields to empty strings (schema columns are non-null)", () => {
    expect(toVoteIdentity({ id: "user-2" })).toEqual({
      voterId: "user-2",
      voterName: "",
      voterEmail: "",
      pattern: "",
    });
  });

  it("throws when the identity has no id (cannot attribute the vote / enforce uniqueness)", () => {
    expect(() => toVoteIdentity({ username: "Anon" })).toThrow(/userInfo\.id/);
  });
});
