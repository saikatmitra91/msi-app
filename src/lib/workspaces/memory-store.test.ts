import { beforeEach, describe, expect, it } from "vitest";
import { MemoryWorkspaceStore } from "./memory-store";
import { WorkspaceError } from "./types";

describe("MemoryWorkspaceStore", () => {
  let store: MemoryWorkspaceStore;

  beforeEach(() => {
    store = new MemoryWorkspaceStore();
  });

  it("creates and lists workspaces for the owner", async () => {
    const a = await store.create({ name: "Alpha", ownerUserId: "u1" });
    const b = await store.create({ name: "Beta", ownerUserId: "u1" });
    await store.create({ name: "Other", ownerUserId: "u2" });

    const mine = await store.list("u1");
    expect(mine.map((w) => w.id)).toEqual([a.id, b.id]);

    const others = await store.list("u2");
    expect(others).toHaveLength(1);
    expect(others[0]?.name).toBe("Other");
  });

  it("rejects empty names on create + update", async () => {
    await expect(store.create({ name: "  ", ownerUserId: "u1" })).rejects.toBeInstanceOf(
      WorkspaceError,
    );
    const w = await store.create({ name: "Real", ownerUserId: "u1" });
    await expect(store.update(w.id, { name: "" })).rejects.toBeInstanceOf(WorkspaceError);
  });

  it("updates a workspace name", async () => {
    const w = await store.create({ name: "Old", ownerUserId: "u1" });
    const updated = await store.update(w.id, { name: "New" });
    expect(updated.name).toBe("New");
    expect((await store.get(w.id))?.name).toBe("New");
  });

  it("removes a workspace", async () => {
    const w = await store.create({ name: "Doomed", ownerUserId: "u1" });
    await store.remove(w.id);
    expect(await store.get(w.id)).toBeNull();
    await expect(store.remove(w.id)).rejects.toBeInstanceOf(WorkspaceError);
  });
});
