// ============================================
// SCAN2WIN — Event Manager
// Route: /admin/campaigns
// ============================================

import { useState } from "react";
import {
  App,
  Button,
  DatePicker,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  QrcodeOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { QRCodeCanvas } from "qrcode.react";
import {
  Activity,
  CheckCircle2,
  Clock3,
  Megaphone,
  XCircle,
  Zap,
} from "lucide-react";
import dayjs from "dayjs";
import {
  useListCampaigns,
  useCreateCampaign,
  useUpdateCampaign,
  useDeleteCampaign,
  useGetCampaignBooths,
  useGetCampaignPrizes,
} from "../../services/requests/useApi";

const { Text } = Typography;
const { TextArea } = Input;

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_META = {
  draft: { color: "default", label: "Draft" },
  active: { color: "success", label: "Active" },
  ended: { color: "processing", label: "Ended" },
  cancelled: { color: "error", label: "Cancelled" },
};

const fmtDate = (iso) => (iso ? dayjs(iso).format("MMM D, YYYY") : "—");
const boothQrUrl = (eventTag, boothCode, points) =>
  `${window.location.origin}/${eventTag}?i=${boothCode}&p=${points}`;

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = ({ icon, label, value, accent }) => (
  <div
    className="flex items-center gap-4 rounded-2xl px-5 py-4 flex-1"
    style={{ backgroundColor: "#16213E", borderLeft: `3px solid ${accent}` }}
  >
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
      style={{ backgroundColor: `${accent}20` }}
    >
      {icon}
    </div>
    <div>
      <p className="text-xs mb-0.5" style={{ color: "#8892A4" }}>
        {label}
      </p>
      <p className="text-xl font-black leading-none" style={{ color: "#fff" }}>
        {value}
      </p>
    </div>
  </div>
);

// ─── Booth QR Modal ───────────────────────────────────────────────────────────

const CARD_ACCENTS = ["#E94560", "#F5A623", "#00D68F", "#7360F2", "#4096ff"];

const downloadBoothQR = (boothCode) => {
  const canvas = document.getElementById(`qr-${boothCode}`);
  if (!canvas) return;
  const a = document.createElement("a");
  a.download = `${boothCode}.png`;
  a.href = canvas.toDataURL("image/png");
  a.click();
};

const downloadAllQRs = (booths) => {
  booths.forEach((booth, i) => {
    setTimeout(() => downloadBoothQR(booth.boothCode), i * 120);
  });
};

const BoothQrModal = ({ open, onClose, campaign, booths }) => {
  if (!campaign) return null;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={860}
      destroyOnHidden
      styles={{
        header: {
          background: "#0F1629",
          borderBottom: "1px solid #16213E",
          padding: "20px 24px",
        },
        body: { background: "#0F1629", padding: "20px 24px 24px" },
        content: { background: "#0F1629" },
      }}
      title={
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "#E9456020" }}
            >
              <QrcodeOutlined style={{ color: "#E94560", fontSize: 14 }} />
            </div>
            <span className="font-black text-base" style={{ color: "#fff" }}>
              Booth QR Codes
            </span>
          </div>
          <p className="text-xs ml-9" style={{ color: "#8892A4" }}>
            {campaign.campaignName} &middot; {booths.length} active booth
            {booths.length !== 1 ? "s" : ""}
          </p>
        </div>
      }
    >
      {booths.length === 0 ? (
        <Empty
          description={
            <span style={{ color: "#8892A4" }}>No active booths</span>
          }
          className="py-12"
        />
      ) : (
        <>
          {/* URL format + Download All */}
          <div
            className="flex items-center justify-between gap-3 mb-5 rounded-xl px-4 py-3"
            style={{ background: "#16213E", border: "1px solid #1A1A2E" }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs shrink-0" style={{ color: "#8892A4" }}>
                URL:
              </span>
              <code className="text-xs truncate" style={{ color: "#F5A623" }}>
                {window.location.origin}/{campaign.eventTag}
                ?i=&lt;boothCode&gt;&amp;p=&lt;points&gt;
              </code>
            </div>
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => downloadAllQRs(booths)}
              style={{
                background: "#E94560",
                borderColor: "#E94560",
                color: "#fff",
                shrink: 0,
              }}
            >
              Download All
            </Button>
          </div>

          {/* QR grid */}
          <div className="grid grid-cols-3 gap-4 max-h-130 overflow-y-auto pr-1">
            {booths.map((booth, i) => {
              const accent = CARD_ACCENTS[i % CARD_ACCENTS.length];
              return (
                <div
                  key={booth.id}
                  className="rounded-2xl overflow-hidden flex flex-col"
                  style={{
                    background: "#16213E",
                    border: `1px solid ${accent}30`,
                  }}
                >
                  {/* Accent top strip */}
                  <div className="h-1" style={{ background: accent }} />

                  {/* QR area */}
                  <div className="flex items-center justify-center p-5 pb-4">
                    <div
                      className="rounded-xl p-2.5"
                      style={{ background: "#fff" }}
                    >
                      <QRCodeCanvas
                        id={`qr-${booth.boothCode}`}
                        value={boothQrUrl(
                          campaign.eventTag,
                          booth.boothCode,
                          booth.points,
                        )}
                        size={150}
                        level="H"
                        fgColor="#0F1629"
                      />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="px-4 pb-4 flex flex-col items-center gap-3">
                    <div className="text-center">
                      <p
                        className="font-bold text-sm leading-tight"
                        style={{ color: "#fff" }}
                      >
                        {booth.boothName}
                      </p>
                      <p
                        className="text-xs mt-1 font-mono"
                        style={{ color: "#8892A4" }}
                      >
                        {booth.boothCode}
                      </p>
                    </div>

                    {/* Points badge */}
                    <div
                      className="flex items-center gap-1.5 rounded-full px-3 py-1"
                      style={{
                        background: `${accent}20`,
                        border: `1px solid ${accent}40`,
                      }}
                    >
                      <Zap size={11} color={accent} />
                      <span
                        className="text-xs font-black"
                        style={{ color: accent }}
                      >
                        +{booth.points} pts
                      </span>
                    </div>

                    {/* Download button */}
                    <button
                      onClick={() => downloadBoothQR(booth.boothCode)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold transition-opacity hover:opacity-80 active:scale-95"
                      style={{
                        background: `${accent}18`,
                        color: accent,
                        border: `1px solid ${accent}30`,
                      }}
                    >
                      <DownloadOutlined style={{ fontSize: 12 }} />
                      Download PNG
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </Modal>
  );
};

// ─── Event Form Modal ───────────────────────────────────────────────────────

const CampaignFormModal = ({ open, onClose, initialValues }) => {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const { mutateAsync: createCampaign, isPending: creating } =
    useCreateCampaign();
  const { mutateAsync: updateCampaign, isPending: updating } =
    useUpdateCampaign();
  const isEditing = !!initialValues;
  const saving = creating || updating;

  const handleOpen = () => {
    if (isEditing) {
      form.setFieldsValue({
        ...initialValues,
        startDate: initialValues.startDate
          ? dayjs(initialValues.startDate)
          : null,
        endDate: initialValues.endDate ? dayjs(initialValues.endDate) : null,
      });
    } else {
      form.resetFields();
    }
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const payload = {
      ...values,
      startDate: values.startDate?.format("YYYY-MM-DD"),
      endDate: values.endDate?.format("YYYY-MM-DD"),
    };
    try {
      if (isEditing) {
        await updateCampaign({ id: initialValues.id, ...payload });
        message.success("Campaign updated.");
      } else {
        await createCampaign(payload);
        message.success("Campaign created.");
      }
      onClose();
    } catch (err) {
      message.error(err?.message || "Failed to save event.");
    }
  };

  return (
    <Modal
      open={open}
      title={isEditing ? "Edit Event" : "New Event"}
      onCancel={onClose}
      afterOpenChange={(v) => {
        if (v) handleOpen();
      }}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={saving}>
          Cancel
        </Button>,
        <Button
          key="save"
          type="primary"
          loading={saving}
          onClick={handleSubmit}
          style={{ background: "#E94560", borderColor: "#E94560" }}
        >
          {isEditing ? "Save Changes" : "Create Event"}
        </Button>,
      ]}
      width={560}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" className="pt-2">
        <div className="grid grid-cols-2 gap-x-4">
          <Form.Item
            label="Event Code"
            name="campaignCode"
            rules={[{ required: true, message: "Required" }]}
          >
            <Input placeholder="RFFL-2026-001" />
          </Form.Item>
          <Form.Item
            label="Event Tag"
            name="eventTag"
            rules={[{ required: true, message: "Required" }]}
          >
            <Input placeholder="MIAS2026" />
          </Form.Item>
        </div>
        <Form.Item
          label="Event Name"
          name="campaignName"
          rules={[{ required: true, message: "Required" }]}
        >
          <Input placeholder="MIAS 2026 Raffle Campaign" />
        </Form.Item>
        <Form.Item label="Description" name="description">
          <TextArea rows={3} placeholder="Optional description…" />
        </Form.Item>
        <div className="grid grid-cols-3 gap-x-4">
          <Form.Item
            label="Threshold (pts)"
            name="thresholdPoints"
            rules={[{ required: true, message: "Required" }]}
          >
            <InputNumber min={1} className="w-full" placeholder="300" />
          </Form.Item>
          <Form.Item
            label="Start Date"
            name="startDate"
            rules={[{ required: true, message: "Required" }]}
          >
            <DatePicker className="w-full" />
          </Form.Item>
          <Form.Item
            label="End Date"
            name="endDate"
            rules={[{ required: true, message: "Required" }]}
          >
            <DatePicker className="w-full" />
          </Form.Item>
        </div>
        <Form.Item
          label="Status"
          name="status"
          rules={[{ required: true, message: "Required" }]}
          initialValue="draft"
        >
          <Select
            options={Object.entries(STATUS_META).map(([value, { label }]) => ({
              value,
              label,
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

// ─── Drawer Tabs ──────────────────────────────────────────────────────────────

const BoothsTab = ({ campaign }) => {
  const { data, isLoading } = useGetCampaignBooths(campaign.id);
  const booths = data?.data?.booths ?? [];
  const [qrOpen, setQrOpen] = useState(false);
  const activeBooths = booths.filter((b) => b.isActive !== 0);

  if (isLoading)
    return (
      <div className="flex justify-center py-10">
        <Spin />
      </div>
    );
  if (!booths.length) return <Empty description="No booths found" />;

  return (
    <>
      <div className="flex justify-end mb-3">
        <Button
          type="primary"
          icon={<QrcodeOutlined />}
          onClick={() => setQrOpen(true)}
          disabled={activeBooths.length === 0}
          style={{ background: "#E94560", borderColor: "#E94560" }}
        >
          Generate QR Codes ({activeBooths.length})
        </Button>
      </div>
      <Table
        dataSource={booths}
        columns={[
          {
            title: "Code",
            dataIndex: "boothCode",
            key: "boothCode",
            render: (v) => (
              <Text code className="text-xs">
                {v}
              </Text>
            ),
          },
          { title: "Name", dataIndex: "boothName", key: "boothName" },
          {
            title: "Points",
            dataIndex: "points",
            key: "points",
            width: 85,
            render: (v) => (
              <span className="font-bold text-[#E94560]">{v} pts</span>
            ),
          },
          {
            title: "Max Scans",
            dataIndex: "maxScanPerUser",
            key: "maxScanPerUser",
            width: 100,
            render: (v) => (v === 0 ? "Unlimited" : v),
          },
          {
            title: "Status",
            dataIndex: "isActive",
            key: "isActive",
            width: 90,
            render: (v) =>
              v !== 0 ? <Tag color="success">Active</Tag> : <Tag>Inactive</Tag>,
          },
        ]}
        rowKey="id"
        size="small"
        pagination={false}
      />
      <BoothQrModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        campaign={campaign}
        booths={activeBooths}
      />
    </>
  );
};

const PrizeStatsTab = ({ campaignId }) => {
  const { data, isLoading } = useGetCampaignPrizes(campaignId);
  const summary = data?.data?.summary ?? [];
  const recentClaims = data?.data?.recentClaims ?? [];

  if (isLoading)
    return (
      <div className="flex justify-center py-10">
        <Spin />
      </div>
    );

  return (
    <div className="space-y-6">
      <div>
        <p className="font-semibold text-sm mb-2 text-gray-700">
          Prize Summary
        </p>
        {summary.length ? (
          <Table
            dataSource={summary}
            columns={[
              { title: "Prize", dataIndex: "prizeName", key: "prizeName" },
              {
                title: "Times Won",
                dataIndex: "count",
                key: "count",
                width: 110,
              },
            ]}
            rowKey="prizeName"
            size="small"
            pagination={false}
          />
        ) : (
          <Empty description="No prizes awarded yet" />
        )}
      </div>
      <div>
        <p className="font-semibold text-sm mb-2 text-gray-700">
          Recent Claims
        </p>
        {recentClaims.length ? (
          <Table
            dataSource={recentClaims}
            columns={[
              { title: "#", dataIndex: "claimId", key: "claimId", width: 55 },
              { title: "Prize", dataIndex: "prizeName", key: "prizeName" },
              { title: "Claimed By", dataIndex: "claimedBy", key: "claimedBy" },
              {
                title: "Date",
                dataIndex: "claimedAt",
                key: "claimedAt",
                render: fmtDate,
              },
              {
                title: "Status",
                dataIndex: "status",
                key: "status",
                width: 90,
                render: (v) => <Tag color="success">{v}</Tag>,
              },
            ]}
            rowKey="claimId"
            size="small"
            pagination={{ pageSize: 10, size: "small" }}
          />
        ) : (
          <Empty description="No claims yet" />
        )}
      </div>
    </div>
  );
};

const CampaignDetailDrawer = ({ campaign, open, onClose }) => {
  if (!campaign) return null;
  const { color, label } = STATUS_META[campaign.status] ?? {
    color: "default",
    label: campaign.status,
  };

  return (
    <Drawer
      title={
        <div className="flex items-center gap-2">
          <span className="font-bold">{campaign.campaignName}</span>
          <Tag color={color}>{label}</Tag>
        </div>
      }
      open={open}
      onClose={onClose}
      size="large"
      destroyOnHidden
    >
      <Descriptions
        column={2}
        size="small"
        bordered
        className="mb-5"
        items={[
          {
            label: "Code",
            children: <Text code>{campaign.campaignCode}</Text>,
          },
          {
            label: "Event Tag",
            children: <Tag color="blue">{campaign.eventTag}</Tag>,
          },
          {
            label: "Threshold",
            children: (
              <span className="font-bold text-[#E94560]">
                {campaign.thresholdPoints} pts
              </span>
            ),
          },
          {
            label: "Dates",
            children: `${fmtDate(campaign.startDate)} – ${fmtDate(campaign.endDate)}`,
          },
          ...(campaign.description
            ? [
                {
                  label: "Description",
                  children: campaign.description,
                  span: 2,
                },
              ]
            : []),
        ]}
      />
      <Tabs
        items={[
          {
            key: "booths",
            label: "Booths & QR Codes",
            children: <BoothsTab campaign={campaign} />,
          },
          {
            key: "prizes",
            label: "Prize Stats",
            children: <PrizeStatsTab campaignId={campaign.id} />,
          },
        ]}
      />
    </Drawer>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const CampaignManager = () => {
  const { message } = App.useApp();
  const { data, isLoading, refetch, isFetching } = useListCampaigns();
  const { mutateAsync: deleteCampaign, isPending: deleting } =
    useDeleteCampaign();

  const campaigns = data?.data?.campaigns ?? [];
  const counts = {
    total: campaigns.length,
    active: campaigns.filter((c) => c.status === "active").length,
    draft: campaigns.filter((c) => c.status === "draft").length,
    ended: campaigns.filter((c) => c.status === "ended").length,
    cancelled: campaigns.filter((c) => c.status === "cancelled").length,
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [drawerTarget, setDrawerTarget] = useState(null);

  const openCreate = () => {
    setEditTarget(null);
    setModalOpen(true);
  };
  const openEdit = (c) => {
    setEditTarget(c);
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setEditTarget(null);
  };

  const handleDelete = async (id) => {
    try {
      await deleteCampaign(id);
      message.success("Event deleted.");
    } catch (err) {
      message.error(err?.message || "Delete failed.");
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 55,
      render: (v) => (
        <Text type="secondary" className="text-xs">
          #{v}
        </Text>
      ),
    },
    {
      title: "Code",
      dataIndex: "campaignCode",
      key: "campaignCode",
      width: 165,
      render: (v) => (
        <Text code className="text-xs">
          {v}
        </Text>
      ),
    },
    {
      title: "Event Name",
      dataIndex: "campaignName",
      key: "campaignName",
      render: (v, r) => (
        <div>
          <p
            className="font-semibold text-sm leading-tight"
            style={{ color: "#fff" }}
          >
            {v}
          </p>
          {r.description && (
            <p
              className="text-xs mt-0.5 truncate max-w-xs"
              style={{ color: "#8892A4" }}
            >
              {r.description}
            </p>
          )}
        </div>
      ),
    },
    {
      title: "Event Tag",
      dataIndex: "eventTag",
      key: "eventTag",
      width: 115,
      render: (v) => (
        <Tag color="blue" className="font-mono font-bold">
          {v}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (v) => {
        const meta = STATUS_META[v] ?? { color: "default", label: v };
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: "Dates",
      key: "dates",
      width: 200,
      render: (_, r) => (
        <span className="text-xs" style={{ color: "#8892A4" }}>
          {fmtDate(r.startDate)} – {fmtDate(r.endDate)}
        </span>
      ),
    },
    {
      title: "Threshold",
      dataIndex: "thresholdPoints",
      key: "thresholdPoints",
      width: 105,
      render: (v) => <span className="font-bold text-[#E94560]">{v} pts</span>,
    },
    {
      title: "Actions",
      key: "actions",
      width: 110,
      render: (_, record) => (
        <Space size={2}>
          <Tooltip title="View booths & QR codes">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined style={{ color: "#8892A4" }} />}
              onClick={() => setDrawerTarget(record)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: "#8892A4" }} />}
              onClick={() => openEdit(record)}
            />
          </Tooltip>
          {record.status === "draft" && (
            <Tooltip title="Delete (draft only)">
              <Popconfirm
                title="Delete this event?"
                description="This cannot be undone."
                okText="Delete"
                okButtonProps={{ danger: true, loading: deleting }}
                onConfirm={() => handleDelete(record.id)}
              >
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined style={{ color: "#E94560" }} />}
                />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="min-h-full" style={{ background: "#0F1629" }}>
      {/* Header */}
      <div
        className="px-6 pt-6 pb-5"
        style={{ borderBottom: "1px solid #16213E" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "#E9456020" }}
            >
              <Megaphone color="#E94560" size={20} />
            </div>
            <div>
              <h1
                className="font-black text-lg leading-none"
                style={{ color: "#fff" }}
              >
                Event Manager
              </h1>
              <p className="text-xs mt-0.5" style={{ color: "#8892A4" }}>
                Manage raffle events and generate booth QR codes
              </p>
            </div>
          </div>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => refetch()}
              loading={isFetching}
              style={{
                background: "#16213E",
                borderColor: "#16213E",
                color: "#fff",
              }}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreate}
              style={{ background: "#E94560", borderColor: "#E94560" }}
            >
              New Event
            </Button>
          </Space>
        </div>

        {/* Stats */}
        <div className="flex gap-3 mt-5">
          <StatCard
            icon={<Zap size={18} color="#E94560" />}
            label="Total"
            value={counts.total}
            accent="#E94560"
          />
          <StatCard
            icon={<Activity size={18} color="#00D68F" />}
            label="Active"
            value={counts.active}
            accent="#00D68F"
          />
          <StatCard
            icon={<Clock3 size={18} color="#8892A4" />}
            label="Draft"
            value={counts.draft}
            accent="#8892A4"
          />
          <StatCard
            icon={<CheckCircle2 size={18} color="#4096ff" />}
            label="Ended"
            value={counts.ended}
            accent="#4096ff"
          />
          <StatCard
            icon={<XCircle size={18} color="#F5A623" />}
            label="Cancelled"
            value={counts.cancelled}
            accent="#F5A623"
          />
        </div>
      </div>

      {/* Table */}
      <div className="p-6">
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid #16213E" }}
        >
          <Table
            dataSource={campaigns}
            columns={columns}
            rowKey="id"
            loading={isLoading}
            pagination={{ pageSize: 15, showSizeChanger: false }}
            size="middle"
            locale={{
              emptyText: (
                <Empty description="No events yet" className="py-10" />
              ),
            }}
            style={{ background: "#16213E" }}
            onRow={() => ({ style: { background: "#16213E" } })}
          />
        </div>
      </div>

      <CampaignFormModal
        open={modalOpen}
        onClose={closeModal}
        initialValues={editTarget}
      />
      <CampaignDetailDrawer
        campaign={drawerTarget}
        open={!!drawerTarget}
        onClose={() => setDrawerTarget(null)}
      />
    </div>
  );
};

export default CampaignManager;
