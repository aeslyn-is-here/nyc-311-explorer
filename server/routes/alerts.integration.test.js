const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;
let app;

// Starting the in-memory MongoDB binary (especially on first run, when it
// has to download it) can take a while, so this gets a longer timeout than
// the default 5s.
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  app = require("../app");
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("auth + alerts, end to end", () => {
  const testUser = {
    name: "Test User",
    email: "integration-test@example.com",
    password: "goodpass123",
  };

  let token;

  test("registers a new user", async () => {
    const res = await request(app).post("/api/auth/register").send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(testUser.email);
  });

  test("rejects registering the same email twice", async () => {
    const res = await request(app).post("/api/auth/register").send(testUser);

    expect(res.status).toBe(400);
  });

  test("logs in with the correct credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: testUser.email, password: testUser.password });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  test("rejects login with the wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: testUser.email, password: "wrongpassword" });

    expect(res.status).toBe(401);
  });

  test("rejects /api/alerts without a token", async () => {
    const res = await request(app).get("/api/alerts");

    expect(res.status).toBe(401);
  });

  test("creates an alert rule for the logged-in user", async () => {
    const res = await request(app)
      .post("/api/alerts")
      .set("Authorization", `Bearer ${token}`)
      .send({ zip: "10001", complaintType: "Noise", threshold: 50 });

    expect(res.status).toBe(201);
    expect(res.body.zip).toBe("10001");
  });

  test("lists only the logged-in user's alerts", async () => {
    const res = await request(app)
      .get("/api/alerts")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].zip).toBe("10001");
  });

  test("deletes the alert", async () => {
    const listRes = await request(app)
      .get("/api/alerts")
      .set("Authorization", `Bearer ${token}`);
    const alertId = listRes.body[0]._id;

    const deleteRes = await request(app)
      .delete(`/api/alerts/${alertId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(deleteRes.status).toBe(200);

    const afterRes = await request(app)
      .get("/api/alerts")
      .set("Authorization", `Bearer ${token}`);
    expect(afterRes.body).toHaveLength(0);
  });
});
