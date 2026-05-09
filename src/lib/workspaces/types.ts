export interface Workspace {
  id: string;
  name: string;
  ownerUserId: string;
  createdAt: string;
}

export interface WorkspaceStore {
  list(userId: string): Promise<Workspace[]>;
  get(id: string): Promise<Workspace | null>;
  create(input: { name: string; ownerUserId: string }): Promise<Workspace>;
  update(id: string, patch: { name: string }): Promise<Workspace>;
  remove(id: string): Promise<void>;
}

export class WorkspaceError extends Error {
  constructor(
    message: string,
    public readonly code: "not_found" | "invalid_input" | "forbidden",
  ) {
    super(message);
    this.name = "WorkspaceError";
  }
}
