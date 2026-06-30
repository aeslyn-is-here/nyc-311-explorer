function ComplaintCard({ complaint }) {
  return (
    <div className="complaint-card">
      <h2>{complaint.complaint_type}</h2>
      <p><strong>Status:</strong> {complaint.status}</p>
      <p><strong>Agency:</strong> {complaint.agency}</p>
      <p><strong>Descriptor:</strong> {complaint.descriptor || "N/A"}</p>
      <p><strong>Created:</strong> {complaint.created_date}</p>
      <p><strong>Borough:</strong> {complaint.borough}</p>
    </div>
  );
}

export default ComplaintCard;