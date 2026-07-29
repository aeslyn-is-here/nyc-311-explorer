const axios = require("axios");
const config = require("../config");

// NYC Open Data (Socrata) app token raises the API rate limit.
// Sent as an X-App-Token header on every request to the 311 dataset.
const nycApiHeaders = config.nycAppToken
  ? { "X-App-Token": config.nycAppToken }
  : {};

// Single place that actually calls the NYC 311 dataset with a SoQL
// $query string. calculateStats, /api/trend, and /api/complaints all
// go through this instead of each building their own axios call.
const fetchNycComplaints = async (query) => {
  const response = await axios.get(config.nyc311ApiUrl, {
    headers: nycApiHeaders,
    params: {
      $query: query,
    },
  });

  return response.data;
};

const fetchComplaintTypes = async () => {
  const response = await axios.get(config.nyc311ApiUrl, {
    headers: nycApiHeaders,
    params: {
      $select: "complaint_type",
      $group: "complaint_type",
      $order: "complaint_type ASC",
      $limit: 1000,
    },
  });

  return response.data.map((item) => item.complaint_type).filter(Boolean);
};

module.exports = { fetchNycComplaints, fetchComplaintTypes };
