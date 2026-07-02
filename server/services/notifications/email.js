const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmailNotification = async ({
  to,
  complaintType,
  zip,
  percentChange,
  threshold,
}) => {
  await resend.emails.send({
    from: "onboarding@resend.dev",
    to,
    subject: "🚨 NYC 311 Alert Triggered",
    html: `
      <h2>311 Alert Triggered</h2>
      <p>
        <strong>${complaintType}</strong> complaints in ZIP
        <strong>${zip}</strong> increased by
        <strong>${percentChange.toFixed(1)}%</strong>.
      </p>
      <p>Your threshold was <strong>${threshold}%</strong>.</p>
    `,
  });
};

module.exports = sendEmailNotification;