// @vitest-environment jsdom
import learningJson from "../../public/data/learning/route.json";
import productJson from "../../public/data/products/index.json";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LearningPage } from "./LearningPage";

const getLearningProgress = vi.hoisted(() => vi.fn(async () => [{ nodeId: "retired-node", percent: 100, updatedAt: "2026-08-03T00:00:00.000Z" }]));
const setLearningProgress = vi.hoisted(() => vi.fn(async () => undefined));

vi.mock("../state/learningDb", () => ({
  getLearningProgress,
  setLearningProgress
}));

describe("LearningPage", () => {
  beforeEach(() => {
    localStorage.clear();
    getLearningProgress.mockClear();
    setLearningProgress.mockReset();
    setLearningProgress.mockResolvedValue(undefined);
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => Response.json(String(input).includes("products") ? productJson : learningJson)));
  });

  afterEach(cleanup);

  it("does not count progress records for retired learning nodes", async () => {
    render(<MemoryRouter><LearningPage /></MemoryRouter>);
    await waitFor(() => expect(getLearningProgress).toHaveBeenCalled());
    await act(async () => { await Promise.resolve(); });
    expect(screen.getByText(`0/${learningJson.items.length}`)).toBeInTheDocument();
    expect(screen.queryByText(`1/${learningJson.items.length}`)).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Ray-Ban Meta/ })[0]).toHaveAttribute("href", "/products/ray-ban-meta");
  });

  it("locks a node while its progress write is pending", async () => {
    let finish: (() => void) | undefined;
    setLearningProgress.mockImplementationOnce(() => new Promise<undefined>((resolve) => { finish = () => resolve(undefined); }));
    const user = userEvent.setup();
    render(<MemoryRouter><LearningPage /></MemoryRouter>);
    const button = await screen.findByRole("button", { name: "完成 先分清三种产品形态" });

    await user.click(button);

    expect(screen.getByRole("button", { name: "正在保存 先分清三种产品形态" })).toBeDisabled();
    finish?.();
    await waitFor(() => expect(screen.getByText(`1/${learningJson.items.length}`)).toBeInTheDocument());
  });

  it("keeps progress unchanged and reports a storage error", async () => {
    setLearningProgress.mockRejectedValueOnce(new Error("storage unavailable"));
    const user = userEvent.setup();
    render(<MemoryRouter><LearningPage /></MemoryRouter>);

    await user.click(await screen.findByRole("button", { name: "完成 先分清三种产品形态" }));

    expect(await screen.findByRole("status")).toHaveTextContent("进度保存失败，请重试");
    expect(screen.getByText(`0/${learningJson.items.length}`)).toBeInTheDocument();
  });
});
