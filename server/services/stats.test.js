jest.mock("./nyc311");
const { fetchNycComplaints } = require("./nyc311");
const calculateStats = require("./stats");

const daysAgo = (n) =>
  new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

describe("calculateStats", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("rejects an invalid ZIP before ever calling the NYC API", async () => {
    await expect(calculateStats("abc", "Noise")).rejects.toThrow(
      "Invalid ZIP code"
    );
    expect(fetchNycComplaints).not.toHaveBeenCalled();
  });

  test("escapes the complaint type before building the SoQL query", async () => {
    fetchNycComplaints.mockResolvedValue([]);

    await calculateStats("10001", "Rat's Nest");

    const queryArg = fetchNycComplaints.mock.calls[0][0];
    expect(queryArg).toContain("Rat''s Nest");
    expect(queryArg).not.toContain("Rat's Nest");
  });

  test("splits complaints into current week vs previous week", async () => {
    fetchNycComplaints.mockResolvedValue([
      { created_date: daysAgo(1) }, // current week
      { created_date: daysAgo(3) }, // current week
      { created_date: daysAgo(9) }, // previous week
    ]);

    const stats = await calculateStats("10001", "Noise");

    expect(stats.currentWeek).toBe(2);
    expect(stats.previousWeek).toBe(1);
    expect(stats.totalRecordsChecked).toBe(3);
  });

  test("calculates percentChange as a percentage increase/decrease", async () => {
    fetchNycComplaints.mockResolvedValue([
      { created_date: daysAgo(1) },
      { created_date: daysAgo(2) },
      { created_date: daysAgo(9) },
    ]);

    // currentWeek = 2, previousWeek = 1 -> (2-1)/1 * 100 = 100%
    const stats = await calculateStats("10001", "Noise");

    expect(stats.percentChange).toBe(100);
  });

  test("percentChange is null when there's nothing to compare against", async () => {
    fetchNycComplaints.mockResolvedValue([{ created_date: daysAgo(1) }]);

    const stats = await calculateStats("10001", "Noise");

    expect(stats.previousWeek).toBe(0);
    expect(stats.percentChange).toBeNull();
  });
});
