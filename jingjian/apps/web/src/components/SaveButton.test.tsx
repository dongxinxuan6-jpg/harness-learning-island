// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as learningDb from "../state/learningDb";
import { SaveButton } from "./SaveButton";

describe("SaveButton", () => {
  beforeEach(async () => learningDb.clearLearningData());
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it("restores its saved state after remounting", async () => {
    const user = userEvent.setup();
    const view = render(<SaveButton entityType="content" entityId="content-1" />);
    await user.click(await screen.findByRole("button", { name: "收藏" }));
    expect(await screen.findByRole("button", { name: "取消收藏" })).toBeInTheDocument();

    view.unmount();
    render(<SaveButton entityType="content" entityId="content-1" />);
    expect(await screen.findByRole("button", { name: "取消收藏" })).toBeInTheDocument();
  });

  it("disables repeated toggles while persistence is pending", async () => {
    let finish: ((value: boolean) => void) | undefined;
    vi.spyOn(learningDb, "toggleSaved").mockImplementationOnce(() => new Promise<boolean>((resolve) => { finish = resolve; }));
    const user = userEvent.setup();
    render(<SaveButton entityType="content" entityId="content-2" />);
    const button = await screen.findByRole("button", { name: "收藏" });

    await user.click(button);

    expect(screen.getByRole("button", { name: "正在收藏" })).toBeDisabled();
    finish?.(true);
    await waitFor(() => expect(screen.getByRole("button", { name: "取消收藏" })).toBeEnabled());
  });

  it("reports a failed toggle and allows retrying", async () => {
    vi.spyOn(learningDb, "toggleSaved").mockRejectedValueOnce(new Error("storage unavailable"));
    const user = userEvent.setup();
    render(<SaveButton entityType="content" entityId="content-3" />);

    await user.click(await screen.findByRole("button", { name: "收藏" }));

    expect(await screen.findByRole("button", { name: "收藏失败，重试" })).toBeEnabled();
  });
});
