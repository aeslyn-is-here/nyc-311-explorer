// Guards against SoQL injection: zip must look like a real 5-digit ZIP,
// and any text dropped into a SoQL string literal must have its
// single quotes escaped so it can't break out of the query.
const ZIP_REGEX = /^\d{5}$/;
const isValidZip = (zip) => typeof zip === "string" && ZIP_REGEX.test(zip);
const escapeSoqlString = (value) => String(value).replace(/'/g, "''");

// Basic email shape check (not fully RFC-compliant, but catches the
// obvious "not an email" cases without needing an extra library).
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isValidEmail = (email) =>
  typeof email === "string" && EMAIL_REGEX.test(email);

// Password must be at least 8 characters and contain both a letter
// and a number, to rule out trivially guessable passwords.
const isStrongPassword = (password) =>
  typeof password === "string" &&
  password.length >= 8 &&
  /[a-zA-Z]/.test(password) &&
  /[0-9]/.test(password);

// Prevents SSRF: the server later POSTs to this URL unattended, so it
// must genuinely be a Slack webhook, not an arbitrary attacker-chosen
// address. Parsing with `URL` and checking the exact hostname (rather
// than a string prefix like startsWith("https://hooks.slack.com/"))
// avoids being fooled by lookalikes such as
// "https://hooks.slack.com.evil.com/".
const isValidSlackWebhookUrl = (url) => {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" && parsed.hostname === "hooks.slack.com"
    );
  } catch {
    return false;
  }
};

module.exports = {
  isValidZip,
  escapeSoqlString,
  isValidEmail,
  isStrongPassword,
  isValidSlackWebhookUrl,
};
