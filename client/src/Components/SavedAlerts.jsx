function SavedAlerts({
  savedAlerts,
  deleteAlert,
  toggleAlertStatus,
}) {
  return (
    <section className="saved-alerts">
      <h2>Saved Alerts</h2>

      {savedAlerts.length === 0 ? (
        <p>No saved alerts yet.</p>
      ) : (
        savedAlerts.map((alert) => (
          <div className="alert-card" key={alert._id}>
            <h3>{alert.complaintType}</h3>

            <p>
              <strong>ZIP:</strong> {alert.zip}
            </p>

            <p>
              <strong>Threshold:</strong> {alert.threshold}%
            </p>

            <p>
              <strong>Status:</strong>{" "}
              {alert.isActive ? "Active" : "Inactive"}
            </p>

            <button
              onClick={() =>
                toggleAlertStatus(alert._id, alert.isActive)
              }
            >
              {alert.isActive ? "Deactivate" : "Activate"}
            </button>

            <button onClick={() => deleteAlert(alert._id)}>
              Delete
            </button>
          </div>
        ))
      )}
    </section>
  );
}

export default SavedAlerts;