import { beforeEach, describe, expect, it } from "vitest";

class MemStorage {
  private m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
}

beforeEach(() => {
  Object.assign(globalThis, { localStorage: new MemStorage(), sessionStorage: new MemStorage() });
});

const sample = [{ id: "1", name: "A", version: 1 }] as never;

describe("vault", () => {
  it("registers, stores encrypted data, and logs in again", async () => {
    const v = await import("./vault");
    const r = await v.register("Anupam", "correct horse");
    expect(r.session).toBeDefined();
    await v.saveProfiles(r.session!, sample);
    const raw = localStorage.getItem("as_data_v2_anupam")!;
    expect(raw).not.toContain('"name"'); // ciphertext, not plain JSON
    const l = await v.login("anupam", "correct horse");
    expect((await v.loadProfiles(l.session!))[0]).toMatchObject({ id: "1" });
  });
  it("rejects wrong password, duplicates, short passwords and bad names", async () => {
    const v = await import("./vault");
    await v.register("user1", "password1");
    expect((await v.login("user1", "wrongpass1")).error).toBe("badLogin");
    expect((await v.login("nobody", "password1")).error).toBe("badLogin");
    expect((await v.register("user1", "password2")).error).toBe("exists");
    expect((await v.register("user2", "short")).error).toBe("short");
    expect((await v.register("a b", "password1")).error).toBe("badName");
  });
  it("restores session in the same tab and forgets after logout", async () => {
    const v = await import("./vault");
    const r = await v.register("user3", "password3");
    await v.saveProfiles(r.session!, sample);
    const s = await v.restoreSession();
    expect((await v.loadProfiles(s!))[0]).toMatchObject({ id: "1" });
    v.logout();
    expect(await v.restoreSession()).toBeNull();
  });
  it("backup round-trips and rejects foreign files", async () => {
    const v = await import("./vault");
    expect(v.parseBackup(v.exportBackup(sample))).toHaveLength(1);
    expect(v.parseBackup("{}")).toBeNull();
    expect(v.parseBackup("not json")).toBeNull();
  });
  it("deletes account and data", async () => {
    const v = await import("./vault");
    const r = await v.register("user4", "password4");
    v.deleteAccount(r.session!);
    expect((await v.login("user4", "password4")).error).toBe("badLogin");
    expect(localStorage.getItem("as_data_v2_user4")).toBeNull();
  });
});
