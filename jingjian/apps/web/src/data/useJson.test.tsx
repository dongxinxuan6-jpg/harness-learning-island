// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useJson } from "./useJson";

function Probe({ path }: { path: string }) {
  const result = useJson<{ id: string }>(path);
  if (result.loading) return <span>loading</span>;
  if (result.error) return <span>error:{result.error.message}</span>;
  return <span>data:{result.data?.id}</span>;
}

describe("useJson", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("clears data from the previous path while the next request is pending", async () => {
    let resolveSecond!: (response: Response) => void;
    const second = new Promise<Response>((resolve) => { resolveSecond = resolve; });
    vi.stubGlobal("fetch", vi.fn((input: string | URL | Request) => {
      const path = String(input);
      if (path === "/one.json") return Promise.resolve(Response.json({ id: "one" }));
      return second;
    }));

    const view = render(<Probe path="/one.json" />);
    expect(await screen.findByText("data:one")).toBeInTheDocument();

    view.rerender(<Probe path="/two.json" />);
    expect(screen.getByText("loading")).toBeInTheDocument();
    expect(screen.queryByText("data:one")).not.toBeInTheDocument();

    await act(async () => { resolveSecond(Response.json({ id: "two" })); });
    expect(await screen.findByText("data:two")).toBeInTheDocument();
  });
});
