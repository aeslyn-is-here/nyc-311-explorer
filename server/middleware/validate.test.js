const { z } = require("zod");
const validate = require("./validate");

const buildReqRes = (overrides = {}) => {
  const req = { body: {}, query: {}, params: {}, ...overrides };
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  const next = jest.fn();
  return { req, res, next };
};

describe("validate middleware", () => {
  const schema = z.object({
    query: z.object({
      zip: z.string({ error: "zip is required" }),
    }),
  });

  test("calls next() and lets the request through when valid", () => {
    const { req, res, next } = buildReqRes({ query: { zip: "10001" } });

    validate(schema)(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.statusCode).toBeNull();
  });

  test("responds 400 with the schema's message when invalid, and does not call next()", () => {
    const { req, res, next } = buildReqRes({ query: {} });

    validate(schema)(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "zip is required" });
  });

  test("writes transformed values (e.g. trim/lowercase) back onto the request", () => {
    const trimSchema = z.object({
      body: z.object({
        email: z.string().trim().toLowerCase(),
      }),
    });
    const { req, res, next } = buildReqRes({
      body: { email: "  TEST@Example.com  " },
    });

    validate(trimSchema)(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.body.email).toBe("test@example.com");
  });
});
