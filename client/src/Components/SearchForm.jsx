function SearchForm({
  zip,
  setZip,
  complaintType,
  setComplaintType,
  complaintTypes,
  threshold,
  setThreshold,
  searchComplaints,
  analyzeTrend,
}) {
  return (
    <div className="search-box">
      <input
        type="text"
        placeholder="Enter ZIP code, e.g. 10002"
        value={zip}
        onChange={(event) => setZip(event.target.value)}
      />

      <select
        value={complaintType}
        onChange={(event) => setComplaintType(event.target.value)}
      >
        <option value="">All complaint types</option>
        {complaintTypes.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>

      <input
        type="number"
        placeholder="Spike threshold %"
        value={threshold}
        onChange={(event) => setThreshold(Number(event.target.value))}
      />

      <button onClick={searchComplaints}>Search</button>
      <button onClick={analyzeTrend}>Analyze Trend</button>
    </div>
  );
}

export default SearchForm;