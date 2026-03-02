import {
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
} from "lucide-react";
import { Card, Col, Row, Statistic } from "antd";

const MOCK = {
  totalAttendees: 1284,
  approvedAttendees: 976,
  pendingAttendees: 208,
  cancelledAttendees: 100,
};

const StatCard = ({ gradient, icon, label, value }) => (
  <div
    className={`group ${gradient} rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer`}
  >
    <div className="flex items-start justify-between mb-3">
      <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
    </div>
    <div>
      <p className="text-white/80 text-sm font-medium mb-1">{label}</p>
      <p className="text-3xl font-bold text-white">{value.toLocaleString()}</p>
    </div>
  </div>
);

export default function Dashboard() {
  return (
    <div style={{ padding: "24px", background: "#f0f2f5", minHeight: "100vh" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "28px", marginBottom: "8px", color: "#1E3A71" }}>
          Dashboard
        </h1>
        <p style={{ color: "#666" }}>Overview of your application data</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
          icon={<TrendingUp className="w-6 h-6 text-white" strokeWidth={2.5} />}
          label="Total Attendees"
          value={MOCK.totalAttendees}
        />
        <StatCard
          gradient="bg-gradient-to-br from-green-500 to-emerald-600"
          icon={<CheckCircle2 className="w-6 h-6 text-white" strokeWidth={2.5} />}
          label="Approved"
          value={MOCK.approvedAttendees}
        />
        <StatCard
          gradient="bg-gradient-to-br from-yellow-500 to-orange-500"
          icon={<Clock className="w-6 h-6 text-white" strokeWidth={2.5} />}
          label="Pending"
          value={MOCK.pendingAttendees}
        />
        <StatCard
          gradient="bg-gradient-to-br from-indigo-500 to-purple-600"
          icon={<Users className="w-6 h-6 text-white" strokeWidth={2.5} />}
          label="Cancelled"
          value={MOCK.cancelledAttendees}
        />
      </div>

      {/* Summary */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="hover:shadow-lg transition-shadow">
            <Statistic
              title="Total Attendees"
              value={MOCK.totalAttendees}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="hover:shadow-lg transition-shadow">
            <Statistic
              title="Approved"
              value={MOCK.approvedAttendees}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="hover:shadow-lg transition-shadow">
            <Statistic
              title="Pending"
              value={MOCK.pendingAttendees}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="hover:shadow-lg transition-shadow">
            <Statistic
              title="Cancelled"
              value={MOCK.cancelledAttendees}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
