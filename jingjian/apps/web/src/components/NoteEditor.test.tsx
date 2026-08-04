// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NoteEditor } from "./NoteEditor";

const pending = new Map<string, (value: string) => void>();
const saveNote = vi.hoisted(() => vi.fn(async () => undefined));

vi.mock("../state/learningDb", () => ({
  getNote: vi.fn((_entityType: string, entityId: string) => new Promise<string>((resolve) => pending.set(entityId, resolve))),
  saveNote
}));

beforeEach(() => {
  saveNote.mockReset();
  saveNote.mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
  pending.clear();
});

describe("NoteEditor", () => {
  it("ignores a late note response from the previous entity", async () => {
    const view = render(<NoteEditor entityType="product" entityId="first" />);
    view.rerender(<NoteEditor entityType="product" entityId="second" />);

    await act(async () => { pending.get("second")?.("second note"); });
    expect(screen.getByRole("textbox", { name: "我的笔记" })).toHaveValue("second note");

    await act(async () => { pending.get("first")?.("first note"); });
    expect(screen.getByRole("textbox", { name: "我的笔记" })).toHaveValue("second note");
  });

  it("does not overwrite an edit made while the stored note is loading", async () => {
    render(<NoteEditor entityType="content" entityId="draft" />);
    const editor = screen.getByRole("textbox", { name: "我的笔记" });
    fireEvent.change(editor, { target: { value: "new draft" } });

    await act(async () => { pending.get("draft")?.("stored note"); });

    expect(editor).toHaveValue("new draft");
  });

  it("serializes overlapping saves so newer text is persisted last", async () => {
    let finishFirst: (() => void) | undefined;
    saveNote.mockImplementationOnce(() => new Promise<undefined>((resolve) => { finishFirst = () => resolve(undefined); }));
    render(<NoteEditor entityType="content" entityId="draft" />);
    const editor = screen.getByRole("textbox", { name: "我的笔记" });

    fireEvent.change(editor, { target: { value: "first draft" } });
    fireEvent.blur(editor);
    fireEvent.change(editor, { target: { value: "second draft" } });
    fireEvent.blur(editor);

    expect(saveNote).toHaveBeenCalledTimes(1);
    finishFirst?.();
    await waitFor(() => expect(saveNote).toHaveBeenCalledTimes(2));
    expect(saveNote).toHaveBeenLastCalledWith("content", "draft", "second draft");
  });

  it("shows a recoverable status when a save fails", async () => {
    saveNote.mockRejectedValueOnce(new Error("storage unavailable"));
    render(<NoteEditor entityType="content" entityId="draft" />);
    const editor = screen.getByRole("textbox", { name: "我的笔记" });

    fireEvent.change(editor, { target: { value: "draft" } });
    fireEvent.blur(editor);

    expect(await screen.findByText("保存失败，请重试")).toBeInTheDocument();
  });
});
