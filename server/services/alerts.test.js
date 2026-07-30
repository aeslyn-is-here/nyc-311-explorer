jest.mock("../models/AlertRule");
jest.mock("./stats");
jest.mock("axios");
jest.mock("./notifications/email");

const AlertRule = require("../models/AlertRule");
const calculateStats = require("./stats");
const axios = require("axios");
const sendEmailNotification = require("./notifications/email");
const checkAlerts = require("./alerts");

const makeAlert = (overrides = {}) => ({
  _id: "alert-1",
  zip: "10001",
  complaintType: "Noise",
  threshold: 50,
  currentlyTriggered: false,
  userId: {
    notificationMethod: "slack",
    slackWebhookUrl: "https://hooks.slack.com/services/T0/B0/xxxx",
    emailNotificationAddress: "",
  },
  save: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

const mockActiveAlerts = (alerts) => {
  AlertRule.find.mockReturnValue({
    populate: jest.fn().mockResolvedValue(alerts),
  });
};

describe("checkAlerts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("sends a Slack notification and marks the alert triggered when the threshold is crossed", async () => {
    const alert = makeAlert();
    mockActiveAlerts([alert]);
    calculateStats.mockResolvedValue({ percentChange: 100 });

    await checkAlerts();

    expect(axios.post).toHaveBeenCalledWith(
      "https://hooks.slack.com/services/T0/B0/xxxx",
      expect.objectContaining({ text: expect.stringContaining("Noise") })
    );
    expect(alert.currentlyTriggered).toBe(true);
    expect(alert.save).toHaveBeenCalled();
  });

  test("sends an email notification when notificationMethod is email", async () => {
    const alert = makeAlert({
      userId: {
        notificationMethod: "email",
        slackWebhookUrl: "",
        emailNotificationAddress: "user@example.com",
      },
    });
    mockActiveAlerts([alert]);
    calculateStats.mockResolvedValue({ percentChange: 100 });

    await checkAlerts();

    expect(sendEmailNotification).toHaveBeenCalledWith(
      expect.objectContaining({ to: "user@example.com" })
    );
    expect(axios.post).not.toHaveBeenCalled();
  });

  test("does not re-notify an alert that's already triggered", async () => {
    const alert = makeAlert({ currentlyTriggered: true });
    mockActiveAlerts([alert]);
    calculateStats.mockResolvedValue({ percentChange: 100 });

    await checkAlerts();

    expect(axios.post).not.toHaveBeenCalled();
    expect(sendEmailNotification).not.toHaveBeenCalled();
    expect(alert.save).not.toHaveBeenCalled();
  });

  test("resets currentlyTriggered when the alert drops back below threshold", async () => {
    const alert = makeAlert({ currentlyTriggered: true });
    mockActiveAlerts([alert]);
    calculateStats.mockResolvedValue({ percentChange: 5 });

    await checkAlerts();

    expect(alert.currentlyTriggered).toBe(false);
    expect(alert.save).toHaveBeenCalled();
    expect(axios.post).not.toHaveBeenCalled();
  });

  test("does not trigger when percentChange is null", async () => {
    const alert = makeAlert();
    mockActiveAlerts([alert]);
    calculateStats.mockResolvedValue({ percentChange: null });

    await checkAlerts();

    expect(alert.currentlyTriggered).toBe(false);
    expect(alert.save).not.toHaveBeenCalled();
  });

  test("skips an alert whose stats calculation fails, without crashing the batch", async () => {
    const badAlert = makeAlert({ _id: "bad-alert" });
    const goodAlert = makeAlert({ _id: "good-alert" });
    mockActiveAlerts([badAlert, goodAlert]);

    calculateStats
      .mockRejectedValueOnce(new Error("Invalid ZIP code"))
      .mockResolvedValueOnce({ percentChange: 100 });

    await checkAlerts();

    expect(badAlert.save).not.toHaveBeenCalled();
    expect(goodAlert.currentlyTriggered).toBe(true);
    expect(goodAlert.save).toHaveBeenCalled();
  });

  test("does not notify when no notification method is configured", async () => {
    const alert = makeAlert({
      userId: {
        notificationMethod: "none",
        slackWebhookUrl: "",
        emailNotificationAddress: "",
      },
    });
    mockActiveAlerts([alert]);
    calculateStats.mockResolvedValue({ percentChange: 100 });

    await checkAlerts();

    expect(axios.post).not.toHaveBeenCalled();
    expect(sendEmailNotification).not.toHaveBeenCalled();
  });
});
