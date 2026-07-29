const { isValidZip, escapeSoqlString } = require("../utils/validation");
const { fetchNycComplaints } = require("./nyc311");

const calculateStats = async (zip, complaintType) => {
  if (!isValidZip(zip)) {
    throw new Error("Invalid ZIP code");
  }

  const today = new Date();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);

  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(today.getDate() - 14);

  const query = `
    SELECT *
    WHERE incident_zip='${zip}'
    AND complaint_type='${escapeSoqlString(complaintType)}'
    ORDER BY created_date DESC
    LIMIT 5000
  `;

  const complaints = await fetchNycComplaints(query);

  let currentWeek = 0;
  let previousWeek = 0;

  complaints.forEach((complaint) => {
    const createdDate = new Date(complaint.created_date);

    if (createdDate >= sevenDaysAgo && createdDate < today) {
      currentWeek++;
    } else if (
      createdDate >= fourteenDaysAgo &&
      createdDate < sevenDaysAgo
    ) {
      previousWeek++;
    }
  });

  let percentChange = null;

  if (previousWeek > 0) {
    percentChange = ((currentWeek - previousWeek) / previousWeek) * 100;
  }

  return {
    zip,
    complaintType,
    currentWeek,
    previousWeek,
    percentChange,
    totalRecordsChecked: complaints.length,
    currentWindow: {
      start: sevenDaysAgo.toISOString(),
      end: today.toISOString(),
    },
    previousWindow: {
      start: fourteenDaysAgo.toISOString(),
      end: sevenDaysAgo.toISOString(),
    },
  };
};

module.exports = calculateStats;
