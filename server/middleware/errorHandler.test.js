jest.mock("../services/nyc311");
const request = require("supertest");
const { fetchComplaintTypes } = require("../services/nyc311");
const app = require("../app");

describe("centralized error handling", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("an unexpected error in a route returns a generic 500 without leaking details", async () => {
    fetchComplaintTypes.mockRejectedValue(
      new Error("boom: something broke internally")
    );

    const res = await request(app).get("/api/complaint-types");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: "Something went wrong. Please try again.",
    });
    expect(JSON.stringify(res.body)).not.toContain("boom");
    expect(res.text).not.toContain("at Object"); // no stack trace in the body
  });

  test("the server keeps handling requests normally after an error", async () => {
    fetchComplaintTypes.mockResolvedValue(["Noise - Residential"]);

    const res = await request(app).get("/api/complaint-types");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(["Noise - Residential"]);
  });
});
