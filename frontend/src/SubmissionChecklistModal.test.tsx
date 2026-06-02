import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SubmissionChecklistModal from "./SubmissionChecklistModal";
import type { Bounty } from "./types";

const bounty: Bounty = {
  id: "BNTY-300",
  repo: "ritik4ever/stellar-bounty-board",
  issueNumber: 300,
  title: "Keyboard navigation bounty",
  summary: "Make the bounty board fully keyboard navigable.",
  maintainer: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
  contributor: "GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGKCEL9LGAQLHFLQ2GN7SY",
  tokenSymbol: "USDC",
  amount: 150,
  labels: [],
  status: "reserved",
  createdAt: 1_700_000_000,
  deadlineAt: 9_999_999_999,
  version: 1,
  events: [],
};

function renderModal(overrides: Partial<React.ComponentProps<typeof SubmissionChecklistModal>> = {}) {
  return render(
    <SubmissionChecklistModal
      bounty={bounty}
      submitting={false}
      error={null}
      onSubmit={vi.fn()}
      onClose={vi.fn()}
      {...overrides}
    />,
  );
}

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  });
  HTMLDialogElement.prototype.close = vi.fn(function close(this: HTMLDialogElement) {
    this.removeAttribute("open");
  });
});

describe("SubmissionChecklistModal keyboard accessibility", () => {
  it("focuses the first input and traps focus while tabbing", async () => {
    renderModal();

    const contributorInput = screen.getByLabelText(/contributor stellar address/i);
    await waitFor(() => expect(contributorInput).toHaveFocus());

    fireEvent.keyDown(contributorInput, { key: "Tab" });
    expect(screen.getByLabelText(/pull request or demo url/i)).toHaveFocus();

    fireEvent.keyDown(screen.getByLabelText(/pull request or demo url/i), { key: "Tab" });
    expect(screen.getByRole("checkbox", { name: /tests written or updated/i })).toHaveFocus();

    fireEvent.keyDown(screen.getByRole("checkbox", { name: /tests written or updated/i }), { key: "Tab" });
    expect(screen.getByLabelText(/notes for the maintainer/i)).toHaveFocus();

    fireEvent.keyDown(screen.getByLabelText(/notes for the maintainer/i), { key: "Tab" });
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();

    fireEvent.keyDown(screen.getByRole("button", { name: "Cancel" }), { key: "Tab" });
    expect(screen.getByRole("button", { name: "Submit work" })).toHaveFocus();

    fireEvent.keyDown(screen.getByRole("button", { name: "Submit work" }), { key: "Tab" });
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();

    fireEvent.keyDown(screen.getByRole("button", { name: "Close" }), { key: "Tab" });
    expect(contributorInput).toHaveFocus();

    fireEvent.keyDown(contributorInput, { key: "Tab", shiftKey: true });
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();

    fireEvent.keyDown(screen.getByRole("button", { name: "Close" }), { key: "Tab", shiftKey: true });
    expect(screen.getByRole("button", { name: "Submit work" })).toHaveFocus();

    fireEvent.keyDown(screen.getByRole("button", { name: "Submit work" }), { key: "Tab", shiftKey: true });
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();

    fireEvent.keyDown(screen.getByRole("button", { name: "Cancel" }), { key: "Tab", shiftKey: true });
    expect(screen.getByLabelText(/notes for the maintainer/i)).toHaveFocus();
  });

  it("closes through Escape", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderModal({ onClose });

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("has no axe violations", async () => {
    const { container } = renderModal();

    await waitFor(() => expect(screen.getByLabelText(/contributor stellar address/i)).toHaveFocus());
    expect(await axe(container)).toHaveNoViolations();
  });
});
