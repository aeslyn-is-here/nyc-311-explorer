const {
  isValidZip,
  escapeSoqlString,
  isValidEmail,
  isStrongPassword,
  isValidSlackWebhookUrl,
} = require("./validation");

describe("isValidZip", () => {
  test("accepts a real 5-digit ZIP", () => {
    expect(isValidZip("10001")).toBe(true);
  });

  test("rejects a ZIP that's too short", () => {
    expect(isValidZip("1000")).toBe(false);
  });

  test("rejects a ZIP that's too long", () => {
    expect(isValidZip("100011")).toBe(false);
  });

  test("rejects letters", () => {
    expect(isValidZip("abcde")).toBe(false);
  });

  test("rejects a SoQL injection attempt", () => {
    expect(isValidZip("10001' OR '1'='1")).toBe(false);
  });

  test("rejects non-string input", () => {
    expect(isValidZip(10001)).toBe(false);
    expect(isValidZip(null)).toBe(false);
    expect(isValidZip(undefined)).toBe(false);
  });
});

describe("escapeSoqlString", () => {
  test("leaves plain text unchanged", () => {
    expect(escapeSoqlString("Noise - Residential")).toBe(
      "Noise - Residential"
    );
  });

  test("doubles single quotes so they can't break out of the query", () => {
    expect(escapeSoqlString("x' OR '1'='1")).toBe("x'' OR ''1''=''1");
  });
});

describe("isValidEmail", () => {
  test("accepts a normal email", () => {
    expect(isValidEmail("test@example.com")).toBe(true);
  });

  test("rejects a string with no @", () => {
    expect(isValidEmail("not-an-email")).toBe(false);
  });

  test("rejects a string with no domain", () => {
    expect(isValidEmail("test@")).toBe(false);
  });

  test("rejects non-string input", () => {
    expect(isValidEmail(undefined)).toBe(false);
  });
});

describe("isStrongPassword", () => {
  test("accepts a password with letters and numbers, 8+ chars", () => {
    expect(isStrongPassword("goodpass123")).toBe(true);
  });

  test("rejects a password shorter than 8 characters", () => {
    expect(isStrongPassword("abc1")).toBe(false);
  });

  test("rejects a password with only letters", () => {
    expect(isStrongPassword("onlyletters")).toBe(false);
  });

  test("rejects a password with only numbers", () => {
    expect(isStrongPassword("12345678")).toBe(false);
  });
});

describe("isValidSlackWebhookUrl", () => {
  test("accepts a real Slack webhook URL", () => {
    expect(
      isValidSlackWebhookUrl("https://hooks.slack.com/services/T0/B0/xxxx")
    ).toBe(true);
  });

  test("rejects a lookalike subdomain trick", () => {
    expect(
      isValidSlackWebhookUrl("https://hooks.slack.com.evil.com/steal-me")
    ).toBe(false);
  });

  test("rejects a non-Slack host (SSRF target)", () => {
    expect(
      isValidSlackWebhookUrl("http://169.254.169.254/latest/meta-data/")
    ).toBe(false);
  });

  test("rejects plain http (not https)", () => {
    expect(
      isValidSlackWebhookUrl("http://hooks.slack.com/services/T0/B0/xxxx")
    ).toBe(false);
  });

  test("rejects a malformed URL without throwing", () => {
    expect(isValidSlackWebhookUrl("not a url")).toBe(false);
  });
});
