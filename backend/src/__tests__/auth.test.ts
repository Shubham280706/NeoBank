import { jest } from "@jest/globals";

// Mocked before importing the module under test so the static
// `import { supabaseAuthClient }` binding in middleware/auth.ts resolves to
// our fakes instead of trying to build a real Supabase client.
const getUser = jest.fn<() => Promise<{ data: { user: any }; error: { message: string } | null }>>();
const singleProfile = jest.fn<() => Promise<{ data: { role: string } | null; error: any }>>();

jest.unstable_mockModule("../config/supabase.js", () => ({
  supabaseAuthClient: { auth: { getUser } },
  requireSupabase: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: singleProfile,
        }),
      }),
    }),
  }),
}));

const { requireAuth, requireAdmin } = await import("../middleware/auth.js");

function mockRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("requireAuth", () => {
  it("rejects a request with no Authorization header", async () => {
    const req: any = { headers: {} };
    const res = mockRes();
    const next = jest.fn();

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects an invalid/expired token", async () => {
    getUser.mockResolvedValueOnce({ data: { user: null }, error: { message: "bad token" } });
    const req: any = { headers: { authorization: "Bearer bad-token" } };
    const res = mockRes();
    const next = jest.fn();

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("accepts a valid token and sets req.userId", async () => {
    getUser.mockResolvedValueOnce({
      data: { user: { id: "user-123", email: "priya@demo.neo" } },
      error: null,
    });
    const req: any = { headers: { authorization: "Bearer good-token" } };
    const res = mockRes();
    const next = jest.fn();

    await requireAuth(req, res, next);

    expect(req.userId).toBe("user-123");
    expect(req.userEmail).toBe("priya@demo.neo");
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe("requireAdmin", () => {
  it("rejects a non-admin user with 403", async () => {
    singleProfile.mockResolvedValueOnce({ data: { role: "user" }, error: null });
    const req: any = { userId: "user-123" };
    const res = mockRes();
    const next = jest.fn();

    await requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("allows an admin user through and sets req.userRole", async () => {
    singleProfile.mockResolvedValueOnce({ data: { role: "admin" }, error: null });
    const req: any = { userId: "admin-1" };
    const res = mockRes();
    const next = jest.fn();

    await requireAdmin(req, res, next);

    expect(req.userRole).toBe("admin");
    expect(next).toHaveBeenCalledTimes(1);
  });
});
