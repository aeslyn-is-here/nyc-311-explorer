import { useState } from "react";

function NotificationSettings({ user, updateNotificationSettings }) {
  const [notificationMethod, setNotificationMethod] = useState(
    user.notificationMethod || "none"
  );
  const [slackWebhookUrl, setSlackWebhookUrl] = useState(
    user.slackWebhookUrl || ""
  );
  const [emailNotificationAddress, setEmailNotificationAddress] = useState(
    user.emailNotificationAddress || user.email || ""
  );

  const handleSubmit = (event) => {
    event.preventDefault();

    updateNotificationSettings({
      notificationMethod,
      slackWebhookUrl,
      emailNotificationAddress,
    });
  };

  return (
    <section className="notification-settings">
      <h2>Notification Settings</h2>

      <form onSubmit={handleSubmit} className="notification-form">
        <label>
          Notification Method
          <select
            value={notificationMethod}
            onChange={(event) => setNotificationMethod(event.target.value)}
          >
            <option value="none">None</option>
            <option value="slack">Slack</option>
            <option value="email">Email</option>
            <option value="both">Slack + Email</option>
          </select>
        </label>

        {(notificationMethod === "slack" || notificationMethod === "both") && (
          <label>
            Slack Webhook URL
            <input
              type="text"
              placeholder="https://hooks.slack.com/services/..."
              value={slackWebhookUrl}
              onChange={(event) => setSlackWebhookUrl(event.target.value)}
            />
          </label>
        )}

        {(notificationMethod === "email" || notificationMethod === "both") && (
          <label>
            Email Address
            <input
              type="email"
              placeholder="you@example.com"
              value={emailNotificationAddress}
              onChange={(event) =>
                setEmailNotificationAddress(event.target.value)
              }
            />
          </label>
        )}

        <button type="submit">Save Notification Settings</button>
      </form>
    </section>
  );
}

export default NotificationSettings;