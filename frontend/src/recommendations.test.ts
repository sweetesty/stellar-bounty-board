import { describe, expect, it } from "vitest";

import { scoreMatch } from "./recommendations";
import type { Bounty } from "./types";

const bounty: Bounty = {
  id: "BNTY-300",
  repo: "ritik4ever/stellar-bounty-board",
  issueNumber: 300,
  title: "Add keyboard navigation",
  summary: "Improve React accessibility for keyboard-only users.",
  maintainer: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
  tokenSymbol: "USDC",
  amount: 150,
  labels: [{ name: "accessibility", color: "0e8a16" }],
  status: "open",
  createdAt: 1_700_000_000,
  deadlineAt: 9_999_999_999,
  version: 1,
  events: [],
};

describe("scoreMatch", () => {
  it("scores matching contributor skills against bounty text", () => {
    expect(scoreMatch(bounty, ["React", "accessibility"])).toBe(1);
  });
});
