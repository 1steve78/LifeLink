import { afterEach, describe, it, expect, vi } from "vitest";
import { GET } from "../app/api/health/route";

const { executeMock } = vi.hoisted(() => ({ executeMock: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { execute: executeMock } }));

const originalDatabaseUrl = process.env.DATABASE_URL;

afterEach(() => {
  if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = originalDatabaseUrl;
  executeMock.mockReset();
});

describe("Health Check API", () => {
  it("returns 503 when the database is not configured", async () => {
    delete process.env.DATABASE_URL;

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe("error");
    expect(data.checks.database).toBe("not_configured");
    expect(executeMock).not.toHaveBeenCalled();
  });

  it("returns ok when the database query succeeds", async () => {
    process.env.DATABASE_URL = "postgres://health-test";
    executeMock.mockResolvedValue(undefined);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe("ok");
    expect(data.app).toBe("LifeLink");
    expect(data.checks.database).toBe("connected");
    expect(data.timestamp).toBeDefined();
    expect(executeMock).toHaveBeenCalledOnce();
  });

  it("returns 503 when the database query fails", async () => {
    process.env.DATABASE_URL = "postgres://health-test";
    executeMock.mockRejectedValue(new Error("database unavailable"));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe("error");
    expect(data.checks.database).toBe("unavailable");
  });
});
