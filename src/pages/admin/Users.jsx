import { DownloadOutlined, EyeOutlined, SearchOutlined } from "@ant-design/icons";
import {
  App,
  Button,
  Card,
  Descriptions,
  Drawer,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import { useState } from "react";
import {
  useGetAttendees,
  useGetAttendeeById,
  useExportAttendees,
} from "../../services/requests/useApi";

const { Title } = Typography;

const STATUS_COLOR = {
  APPROVED: "green",
  PENDING: "orange",
  REJECTED: "red",
  CANCELLED: "default",
};

const CATEGORIES = [
  "VIP",
  "GENERAL PUBLIC",
  "ROTARIAN",
  "SPOUSE",
  "DISTRICT",
  "PRESIDENT",
];

export default function Attendees() {
  const { message } = App.useApp();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [params, setParams] = useState({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
    eventId: 1,
    search: "",
    category: "",
    transactionId: "",
    procId: "",
  });

  const { data, isLoading } = useGetAttendees(params);
  const { data: detailData, isLoading: isDetailLoading } = useGetAttendeeById(selectedId);
  const { mutate: exportAttendees, isPending: isExporting } = useExportAttendees();

  // Response shape: { data: { attendees: [], pagination: { total, ... } } }
  const attendees = data?.data?.attendees || [];
  const pagination = data?.data?.pagination || {};

  const openDetail = (id) => {
    setSelectedId(id);
    setDrawerOpen(true);
  };

  const handleExport = () => {
    exportAttendees(
      { eventId: params.eventId, category: params.category, search: params.search },
      {
        onSuccess: (res) => {
          const list = res?.data?.attendees || [];
          if (!list.length) {
            message.info("No attendees to export.");
            return;
          }
          // Build CSV
          const headers = [
            "ID", "Transaction ID", "First Name", "Last Name", "Email",
            "Mobile", "Category", "Company", "Position", "Status", "QR Code", "Created At",
          ];
          const rows = list.map((a) => [
            a.id, a.transactionId, a.firstName, a.lastName, a.email,
            a.mobileNumber, a.category, a.companyName, a.position,
            a.transactionStatus, a.qrCode,
            new Date(a.createdAt).toLocaleDateString(),
          ]);
          const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
          const blob = new Blob([csv], { type: "text/csv" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "attendees.csv";
          a.click();
          URL.revokeObjectURL(url);
          message.success(`Exported ${list.length} attendees.`);
        },
        onError: (err) => message.error(err?.message || "Export failed."),
      }
    );
  };

  const columns = [
    {
      title: "Name",
      key: "name",
      render: (_, r) => `${r.firstName} ${r.lastName}`,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      ellipsis: true,
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (v) => <Tag>{v || "—"}</Tag>,
    },
    {
      title: "Status",
      dataIndex: "transactionStatus",
      key: "transactionStatus",
      render: (v) => (
        <Tag color={STATUS_COLOR[v] || "default"}>{v || "—"}</Tag>
      ),
    },
    {
      title: "Transaction #",
      dataIndex: "transactionNumber",
      key: "transactionNumber",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, r) => (
        <Button
          icon={<EyeOutlined />}
          size="small"
          onClick={() => openDetail(r.id)}
        >
          View
        </Button>
      ),
    },
  ];

  const detail = detailData?.data;

  return (
    <div style={{ padding: "24px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <Title level={3} style={{ color: "#1E3A71", margin: 0 }}>
          Attendees
        </Title>
        <Button
          icon={<DownloadOutlined />}
          loading={isExporting}
          onClick={handleExport}
        >
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Space wrap style={{ marginBottom: "16px" }}>
        <Input
          placeholder="Search name / email..."
          prefix={<SearchOutlined />}
          style={{ width: 220 }}
          value={params.search}
          onChange={(e) =>
            setParams((p) => ({ ...p, search: e.target.value, page: 1 }))
          }
          allowClear
        />
        <Select
          placeholder="Category"
          style={{ width: 160 }}
          allowClear
          value={params.category || undefined}
          onChange={(v) => setParams((p) => ({ ...p, category: v || "", page: 1 }))}
          options={CATEGORIES.map((c) => ({ label: c, value: c }))}
        />
        <Select
          placeholder="Status"
          style={{ width: 140 }}
          allowClear
          onChange={(v) =>
            setParams((p) => ({ ...p, transactionStatus: v || "", page: 1 }))
          }
          options={Object.keys(STATUS_COLOR).map((s) => ({ label: s, value: s }))}
        />
      </Space>

      <Card>
        <Table
          dataSource={attendees}
          columns={columns}
          loading={isLoading}
          rowKey="id"
          pagination={{
            current: pagination.page || params.page,
            pageSize: pagination.limit || params.limit,
            total: pagination.total || 0,
            showSizeChanger: true,
            showTotal: (total) => `${total} attendees`,
            onChange: (page, limit) =>
              setParams((p) => ({ ...p, page, limit })),
          }}
        />
      </Card>

      {/* Detail Drawer */}
      <Drawer
        title="Attendee Details"
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setSelectedId(null); }}
        width={480}
        loading={isDetailLoading}
      >
        {detail && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Name">
              {detail.firstName} {detail.lastName}
            </Descriptions.Item>
            <Descriptions.Item label="Email">{detail.email}</Descriptions.Item>
            <Descriptions.Item label="Mobile">{detail.mobileNumber}</Descriptions.Item>
            <Descriptions.Item label="Category">
              <Tag>{detail.category}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={STATUS_COLOR[detail.transactionStatus]}>
                {detail.transactionStatus}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Transaction #">{detail.transactionNumber}</Descriptions.Item>
            <Descriptions.Item label="Transaction ID">{detail.transactionId}</Descriptions.Item>
            <Descriptions.Item label="QR Code">{detail.qrCode}</Descriptions.Item>
            <Descriptions.Item label="Company">{detail.companyName || "—"}</Descriptions.Item>
            <Descriptions.Item label="Position">{detail.position || "—"}</Descriptions.Item>
            <Descriptions.Item label="Amount">
              ₱{Number(detail.amount || 0).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="Event">{detail.eventDisplayName}</Descriptions.Item>
            <Descriptions.Item label="Created">
              {new Date(detail.createdAt).toLocaleString()}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  );
}
