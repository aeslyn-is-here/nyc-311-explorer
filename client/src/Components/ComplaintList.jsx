import ComplaintCard from "./ComplaintCard";

function ComplaintList({ complaints }) {
  return (
    <section className="results">
      {complaints.map((complaint) => (
        <ComplaintCard
          key={complaint.unique_key}
          complaint={complaint}
        />
      ))}
    </section>
  );
}

export default ComplaintList;