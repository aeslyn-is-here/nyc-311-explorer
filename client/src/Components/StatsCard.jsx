function StatsCard({ stats, threshold, saveAlert }) {
  return (
    <section className="stats-card">
    <h2>Trend Analysis</h2>
    <p><strong>ZIP:</strong> {stats.zip}</p>
    <p><strong>Complaint Type:</strong> {stats.complaintType}</p>
    <p><strong>Current 7 Days:</strong> {stats.currentWeek}</p>
    <p><strong>Previous 7 Days:</strong> {stats.previousWeek}</p>
    <p>
      <strong>Percent Change:</strong>{" "}
      {stats.percentChange === null
        ? "No previous complaints to compare"
        : `${stats.percentChange.toFixed(1)}%`}
    </p>

      {stats.percentChange !== null && stats.percentChange >= threshold ? (
        <p style={{ color: "red", fontWeight: "bold" }}>
            🚨 Spike detected
        </p>
      ) : (
        <p style={{ color: "green", fontWeight: "bold" }}>
          ✓ No spike detected
        </p>
      )}  

      <p><strong>Spike Threshold:</strong> {threshold}%</p>

      <button onClick={saveAlert}>
        Save Alert
      </button>

      
    </section>
  );
}

export default StatsCard;