import { describe, it, expect, vi, beforeEach } from "vitest";
import { login, fetchMe, logout } from "./auth";
import { apiClient } from "../lib/client";

vi.mock("../lib/client", () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

const mockedApiClient = apiClient as unknown as {
  post: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
};

describe("auth api", () => {
  beforeEach(() => {
    mockedApiClient.post.mockReset();
    mockedApiClient.get.mockReset();
  });

  it("login calls /auth/login and returns user", async () => {
    const fakeUser = {
      id: "123",
      email: "admin@ncdap.org",
      name: "Admin",
    };

    mockedApiClient.post.mockResolvedValueOnce({ data: fakeUser });

    const result = await login("admin@ncdap.org", "password123");

    expect(mockedApiClient.post).toHaveBeenCalledWith("/auth/login", {
      username: "admin@ncdap.org",
      password: "password123",
    });
    expect(result).toEqual(fakeUser);
  });

  it("fetchMe calls /auth/me and returns user", async () => {
    const fakeUser = {
      id: "123",
      email: "admin@ncdap.org",
      name: "Admin",
    };

    mockedApiClient.get.mockResolvedValueOnce({ data: fakeUser });

    const result = await fetchMe();

    expect(mockedApiClient.get).toHaveBeenCalledWith("/auth/me");
    expect(result).toEqual(fakeUser);
  });

  it("logout calls /auth/logout", async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: {} });

    await logout();

    expect(mockedApiClient.post).toHaveBeenCalledWith("/auth/logout");
  });

  it("login throws on error", async () => {
    mockedApiClient.post.mockRejectedValueOnce(new Error("401 Unauthorized"));

    await expect(
      login("admin@ncdap.org", "wrong")
    ).rejects.toThrow("401 Unauthorized");
  });
});
