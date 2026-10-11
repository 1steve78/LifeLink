import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase server client
const mockGetUser = vi.fn();
const mockUpdateUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
      updateUser: mockUpdateUser,
    },
  })),
}));

// Mock Drizzle database client
const mockSelect = vi.fn();
const mockInsert = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    select: () => mockSelect(),
    insert: () => mockInsert(),
  },
}));

describe("Profile API Route (/api/profile)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/profile", () => {
    it("returns 401 if user is not authenticated", async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: null },
        error: new Error("Not logged in"),
      });

      const { GET } = await import("../app/api/profile/route");
      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toContain("Unauthorized");
    });

    it("returns profile data and completion status for authenticated user", async () => {
      const mockUser = {
        id: "11111111-2222-3333-4444-555555555555",
        email: "donor@example.com",
        created_at: "2026-01-01T00:00:00Z",
        user_metadata: { role: "requester" },
      };
      mockGetUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      const mockDbProfile = {
        id: mockUser.id,
        fullName: "Aarav Sharma",
        role: "donor",
        bloodGroup: "O+",
        phone: "+91 9999999999",
        locality: "Salt Lake, Kolkata",
        availableToDonate: true,
        lastDonationDate: "2026-06-01",
        completedAt: new Date("2026-06-01T12:00:00Z"),
      };

      mockSelect.mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([mockDbProfile]),
          }),
        }),
      });

      const { GET } = await import("../app/api/profile/route");
      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.user.email).toBe("donor@example.com");
      expect(body.user.role).toBe("donor");
      expect(body.profile.fullName).toBe("Aarav Sharma");
      expect(body.isComplete).toBe(true);
    });

    it("uses the signup role when the user has no profile yet", async () => {
      mockGetUser.mockResolvedValueOnce({
        data: {
          user: {
            id: "22222222-3333-4444-5555-666666666666",
            email: "newuser@example.com",
            created_at: "2026-01-01T00:00:00Z",
            user_metadata: {
              role: "requester",
              full_name: "New Requester",
              phone: "+91 9876543210",
              blood_group: "O+",
            },
          },
        },
        error: null,
      });
      mockSelect.mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([]),
          }),
        }),
      });

      const { GET } = await import("../app/api/profile/route");
      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.user.role).toBe("requester");
      expect(body.user.fullName).toBe("New Requester");
      expect(body.user.phone).toBe("+91 9876543210");
      expect(body.user.bloodGroup).toBe("O+");
    });

    it("returns isComplete: false if donor has not provided locality or completedAt", async () => {
      const mockUser = {
        id: "22222222-3333-4444-5555-666666666666",
        email: "newuser@example.com",
        created_at: "2026-01-01T00:00:00Z",
      };
      mockGetUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      mockSelect.mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([]),
          }),
        }),
      });

      const { GET } = await import("../app/api/profile/route");
      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.profile).toBeNull();
      expect(body.isComplete).toBe(false);
    });
  });

  describe("POST /api/profile", () => {
    it("returns 401 if user is not authenticated", async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: null },
        error: new Error("Not logged in"),
      });

      const { POST } = await import("../app/api/profile/route");
      const req = new Request("http://localhost:3000/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: "Unauthorized User",
          accountType: "donor",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it("returns 400 with validation errors if payload is invalid", async () => {
      const mockUser = {
        id: "11111111-2222-3333-4444-555555555555",
        email: "test@example.com",
      };
      mockGetUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      const { POST } = await import("../app/api/profile/route");
      const req = new Request("http://localhost:3000/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: "", // invalid: empty
          accountType: "donor",
          locality: "", // invalid: required for donor
        }),
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.fieldErrors).toBeDefined();
      expect(body.fieldErrors.fullName).toBeDefined();
    });

    it("rejects attempt to assign moderator account type", async () => {
      const mockUser = {
        id: "11111111-2222-3333-4444-555555555555",
        email: "hacker@example.com",
      };
      mockGetUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      const { POST } = await import("../app/api/profile/route");
      const req = new Request("http://localhost:3000/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: "Attacker",
          accountType: "moderator", // illegal attempt
          bloodGroup: "O+",
        }),
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.fieldErrors.accountType).toBeDefined();
    });

    it("successfully persists donor profile and triggers metadata sync", async () => {
      const mockUser = {
        id: "11111111-2222-3333-4444-555555555555",
        email: "donor@example.com",
      };
      mockGetUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      // existing profile query check
      mockSelect.mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([]),
          }),
        }),
      });

      // insert/upsert return mock
      const savedResult = {
        id: mockUser.id,
        fullName: "Swati Sengupta",
        role: "donor",
        bloodGroup: "A+",
        phone: "+91 9123456789",
        locality: "Kankinara, WB",
        availableToDonate: true,
        lastDonationDate: "2026-03-01",
        completedAt: new Date(),
        updatedAt: new Date(),
      };

      mockInsert.mockReturnValueOnce({
        values: () => ({
          onConflictDoUpdate: () => ({
            returning: () => Promise.resolve([savedResult]),
          }),
        }),
      });

      const { POST } = await import("../app/api/profile/route");
      const req = new Request("http://localhost:3000/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: "Swati Sengupta",
          accountType: "donor",
          bloodGroup: "A+",
          phone: "+91 9123456789",
          locality: "Kankinara, WB",
          latitude: 22.87,
          longitude: 88.37,
          availableToDonate: true,
          lastDonationDate: "2026-03-01",
        }),
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.profile.fullName).toBe("Swati Sengupta");
      expect(body.profile.role).toBe("donor");
      expect(mockUpdateUser).toHaveBeenCalled();
    });
  });
});
