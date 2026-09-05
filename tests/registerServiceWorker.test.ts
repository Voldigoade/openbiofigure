import { describe, expect, it, vi } from "vitest";
import { clearDesktopOfflineState } from "../src/registerServiceWorker";

describe("desktop offline state", () => {
  it("removes service workers and caches that can shadow packaged assets", async () => {
    const unregisterFirst = vi.fn().mockResolvedValue(true);
    const unregisterSecond = vi.fn().mockResolvedValue(true);
    const deleteCache = vi.fn().mockResolvedValue(true);

    await clearDesktopOfflineState(
      {
        getRegistrations: vi
          .fn()
          .mockResolvedValue([
            { unregister: unregisterFirst },
            { unregister: unregisterSecond },
          ]),
      },
      {
        keys: vi.fn().mockResolvedValue(["old-release", "current-release"]),
        delete: deleteCache,
      },
    );

    expect(unregisterFirst).toHaveBeenCalledOnce();
    expect(unregisterSecond).toHaveBeenCalledOnce();
    expect(deleteCache).toHaveBeenCalledTimes(2);
    expect(deleteCache).toHaveBeenNthCalledWith(1, "old-release");
    expect(deleteCache).toHaveBeenNthCalledWith(2, "current-release");
  });
});
