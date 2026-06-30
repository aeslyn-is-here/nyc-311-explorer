import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function TrendChart({ trendData }) {
  return (
    <section className="chart-card">
      <h2>14-Day Complaint Trend</h2>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={trendData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="count"
            strokeWidth={2}
            dot={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </section>
  );
}

export default TrendChart;