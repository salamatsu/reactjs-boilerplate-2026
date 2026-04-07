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
  Divider,
  Drawer,
  Empty,
  Form,
  Image,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  QRCode,
  Select,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  Upload,
} from "antd";
import {
  DeleteOutlined,
  CopyOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  QrcodeOutlined,
  ReloadOutlined,
  SwapOutlined,
  UploadOutlined,
} from "@ant-design/icons";
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
  useCreateBooth,
  useUpdateBooth,
  useDeleteBooth,
  useGetCampaignPrizes,
  useCreateCampaignPrize,
  useUpdateCampaignPrize,
  useDeleteCampaignPrize,
  useGetCampaignImages,
  useUploadCampaignImage,
  useUpdateCampaignImage,
  useReplaceCampaignImage,
  useDeleteCampaignImage,
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

const STATUS_ACCENT = {
  draft: "#8892A4",
  active: "#00D68F",
  ended: "#4096ff",
  cancelled: "#F5A623",
};

const IMG_BASE = import.meta.env.VITE_BASEURL_APP ?? "";

const fmtDate = (iso) => (iso ? dayjs(iso).format("MMM DD, YYYY") : "—");
const boothQrUrl = (eventTag, boothCode, points) =>
  `${window.location.origin}/${eventTag}?i=${boothCode}&p=${points}`;

const copyText = (text) => {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text);
  }
  const el = document.createElement("textarea");
  el.value = text;
  el.style.cssText = "position:fixed;opacity:0;pointer-events:none";
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
  return Promise.resolve();
};

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
  const container = document.getElementById(`qr-${boothCode}`);
  const svg = container?.querySelector("svg");
  if (!svg) return;

  const SIZE = 1000;
  const PADDING = 50; // padding on each side
  const QR_SIZE = SIZE - PADDING * 2;

  const svgData = new XMLSerializer().serializeToString(svg);
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");

  const img = new Image();
  img.onload = () => {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.drawImage(img, PADDING, PADDING, QR_SIZE, QR_SIZE); // offset by padding
    const a = document.createElement("a");
    a.download = `${boothCode}.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
  };
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgData);
};

const BoothQrModal = ({ open, onClose, campaign, booths }) => {
  if (!campaign) return null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      placement="right"
      width="80%"
      destroyOnHidden
      styles={{
        header: {
          background: "#0F1629",
          borderBottom: "1px solid #16213E",
          padding: "20px 24px",
        },
        body: { background: "#0F1629", padding: "20px 24px 24px" },
        wrapper: { background: "#0F1629" },
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
          {/* URL format */}
          <div
            className="flex items-center gap-2 mb-5 rounded-xl px-4 py-3 min-w-0"
            style={{ background: "#16213E", border: "1px solid #1A1A2E" }}
          >
            <span className="text-xs shrink-0" style={{ color: "#8892A4" }}>
              URL:
            </span>
            <code className="text-xs truncate" style={{ color: "#F5A623" }}>
              {window.location.origin}/{campaign.eventTag}
              ?i=&lt;boothCode&gt;&amp;p=&lt;points&gt;
            </code>
          </div>

          {/* QR grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
                      id={`qr-${booth.boothCode}`}
                      className="rounded-xl p-2.5"
                      style={{ background: "#fff" }}
                    >
                      <QRCode
                        value={boothQrUrl(
                          campaign.eventTag,
                          booth.boothCode,
                          booth.points,
                        )}
                        type="svg"
                        size={150}
                        errorLevel="H"
                        color="#0F1629"
                        bgColor="#ffffff"
                        bordered={false}
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
    </Drawer>
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
      width="min(560px, 95vw)"
      destroyOnHidden
    >
      <Form form={form} layout="vertical" className="pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4">
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

        <Divider
          orientation="left"
          style={{ borderColor: "#16213E", margin: "4px 0 12px" }}
        >
          <span className="text-xs font-semibold" style={{ color: "#8892A4" }}>
            Worldbex QR Quest Mechanics
          </span>
        </Divider>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <Form.Item
            label="1st Scan Bonus (pts)"
            name="firstScanBonus"
            initialValue={0}
            tooltip="Extra points awarded on the participant's very first booth scan in this campaign"
          >
            <InputNumber
              min={0}
              className="w-full"
              placeholder="0 = disabled"
            />
          </Form.Item>
          <Form.Item
            label="Max Spins Per Participant"
            name="maxSpinsPerParticipant"
            initialValue={1}
            tooltip="How many times one participant can spin the prize wheel"
          >
            <InputNumber min={1} className="w-full" />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
};

// ─── Drawer Tabs ──────────────────────────────────────────────────────────────

const BoothFormModal = ({ open, onClose, campaignId, initialValues }) => {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const { mutateAsync: createBooth, isPending: creating } = useCreateBooth();
  const { mutateAsync: updateBooth, isPending: updating } = useUpdateBooth();
  const isEditing = !!initialValues;
  const saving = creating || updating;

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const payload = { ...values, isActive: values.isActive === 1 };
    try {
      if (isEditing) {
        await updateBooth({
          campaignId,
          boothId: initialValues.id,
          ...payload,
        });
        message.success("Booth updated.");
      } else {
        await createBooth({ campaignId, ...payload });
        message.success("Booth created.");
      }
      onClose();
    } catch (err) {
      message.error(err?.message || "Failed to save booth.");
    }
  };

  return (
    <Modal
      open={open}
      title={isEditing ? "Edit Booth" : "New Booth"}
      onCancel={onClose}
      afterOpenChange={(v) => {
        if (v)
          isEditing
            ? form.setFieldsValue({
                ...initialValues,
                isActive: initialValues.isActive ? 1 : 0,
              })
            : form.resetFields();
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
          {isEditing ? "Save Changes" : "Add Booth"}
        </Button>,
      ]}
      width="min(480px, 95vw)"
      destroyOnHidden
    >
      <Form form={form} layout="vertical" className="pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <Form.Item
            label="Booth Code"
            name="boothCode"
            rules={[{ required: true, message: "Required" }]}
          >
            <Input placeholder="BOOTH-MAIN-01" disabled={isEditing} />
          </Form.Item>
          <Form.Item
            label="Booth Name"
            name="boothName"
            rules={[{ required: true, message: "Required" }]}
          >
            <Input placeholder="Main Stage" />
          </Form.Item>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4">
          <Form.Item
            label="Points"
            name="points"
            rules={[{ required: true, message: "Required" }]}
          >
            <InputNumber min={1} className="w-full" placeholder="100" />
          </Form.Item>
          <Form.Item label="Max Scans" name="maxScanPerUser" initialValue={1}>
            <InputNumber min={0} className="w-full" placeholder="1 (0=∞)" />
          </Form.Item>
          <Form.Item label="Sort Order" name="sortOrder" initialValue={1}>
            <InputNumber min={1} className="w-full" />
          </Form.Item>
        </div>
        <Form.Item label="Status" name="isActive" initialValue={1}>
          <Select
            options={[
              { value: 1, label: "Active" },
              { value: 0, label: "Inactive" },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

const BoothsTab = ({ campaign }) => {
  const { message } = App.useApp();
  const { data, isLoading } = useGetCampaignBooths(campaign.id);
  const { mutateAsync: deleteBooth, isPending: deleting } = useDeleteBooth();
  const booths = data?.data?.booths ?? [];
  const [qrOpen, setQrOpen] = useState(false);
  const [boothModal, setBoothModal] = useState({ open: false, record: null });
  const activeBooths = booths.filter(
    (b) => b.isActive !== false && b.isActive !== 0,
  );

  const handleDelete = async (booth) => {
    try {
      await deleteBooth({ campaignId: campaign.id, boothId: booth.id });
      message.success("Booth deleted.");
    } catch (err) {
      // 409 means scan logs exist — suggest deactivating instead
      if (err?.response?.status === 409) {
        message.warning(
          err?.response?.data?.message ||
            "Cannot delete — scan records exist. Deactivate instead.",
        );
      } else {
        message.error(err?.message || "Delete failed.");
      }
    }
  };

  if (isLoading)
    return (
      <div className="flex justify-center py-10">
        <Spin />
      </div>
    );

  return (
    <>
      <div className="flex justify-between mb-3">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setBoothModal({ open: true, record: null })}
          style={{ background: "#E94560", borderColor: "#E94560" }}
        >
          Add Booth
        </Button>
        <Button
          icon={<QrcodeOutlined />}
          onClick={() => setQrOpen(true)}
          disabled={activeBooths.length === 0}
        >
          QR Codes ({activeBooths.length})
        </Button>
      </div>

      {booths.length === 0 ? (
        <Empty description="No booths yet" />
      ) : (
        <Table
          scroll={{ x: 480 }}
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
              title: "Order",
              dataIndex: "sortOrder",
              key: "sortOrder",
              width: 70,
            },
            {
              title: "Status",
              dataIndex: "isActive",
              key: "isActive",
              width: 90,
              render: (v) =>
                v !== false && v !== 0 ? (
                  <Tag color="success">Active</Tag>
                ) : (
                  <Tag>Inactive</Tag>
                ),
            },
            {
              title: "Actions",
              key: "actions",
              width: 90,
              render: (_, record) => (
                <Space size={2}>
                  <Tooltip title="Edit">
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined style={{ color: "#8892A4" }} />}
                      onClick={() => setBoothModal({ open: true, record })}
                    />
                  </Tooltip>
                  <Tooltip title="Delete">
                    <Popconfirm
                      title="Delete this booth?"
                      description="Blocked if scan records exist. Deactivate instead."
                      okText="Delete"
                      okButtonProps={{ danger: true, loading: deleting }}
                      onConfirm={() => handleDelete(record)}
                    >
                      <Button
                        type="text"
                        size="small"
                        icon={<DeleteOutlined style={{ color: "#E94560" }} />}
                      />
                    </Popconfirm>
                  </Tooltip>
                </Space>
              ),
            },
          ]}
          rowKey="id"
          size="small"
          pagination={false}
        />
      )}

      <BoothQrModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        campaign={campaign}
        booths={activeBooths}
      />
      <BoothFormModal
        open={boothModal.open}
        onClose={() => setBoothModal({ open: false, record: null })}
        campaignId={campaign.id}
        initialValues={boothModal.record}
      />
    </>
  );
};

// ─── Prize Form Modal ──────────────────────────────────────────────────────────

const PrizeFormModal = ({ open, onClose, campaignId, initialValues }) => {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const { mutateAsync: createPrize, isPending: creating } =
    useCreateCampaignPrize();
  const { mutateAsync: updatePrize, isPending: updating } =
    useUpdateCampaignPrize();
  const isEditing = !!initialValues;
  const saving = creating || updating;

  const handleSubmit = async () => {
    const values = await form.validateFields();
    try {
      if (isEditing) {
        await updatePrize({ campaignId, prizeId: initialValues.id, ...values });
        message.success("Prize updated.");
      } else {
        await createPrize({ campaignId, ...values });
        message.success("Prize created.");
      }
      onClose();
    } catch (err) {
      message.error(err?.message || "Failed to save prize.");
    }
  };

  return (
    <Modal
      open={open}
      title={isEditing ? "Edit Prize" : "New Prize"}
      onCancel={onClose}
      afterOpenChange={(v) => {
        if (v)
          isEditing ? form.setFieldsValue(initialValues) : form.resetFields();
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
          {isEditing ? "Save Changes" : "Add Prize"}
        </Button>,
      ]}
      width="min(480px, 95vw)"
      destroyOnHidden
    >
      <Form form={form} layout="vertical" className="pt-2">
        <Form.Item
          label="Prize Name"
          name="prizeName"
          rules={[{ required: true, message: "Required" }]}
        >
          <Input placeholder="Samsung 65-inch TV" />
        </Form.Item>
        <Form.Item label="Description" name="description">
          <Input.TextArea rows={2} placeholder="Optional description…" />
        </Form.Item>
        <div className="grid grid-cols-2 gap-x-4">
          <Form.Item
            label="Quantity"
            name="quantity"
            rules={[{ required: true, message: "Required" }]}
            initialValue={1}
          >
            <InputNumber min={1} className="w-full" />
          </Form.Item>
          <Form.Item label="Sort Order" name="sortOrder" initialValue={1}>
            <InputNumber min={1} className="w-full" />
          </Form.Item>
        </div>
        <Form.Item label="Status" name="isActive" initialValue={true}>
          <Select
            options={[
              { value: true, label: "Active" },
              { value: false, label: "Inactive" },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

// ─── Prizes Tab ────────────────────────────────────────────────────────────────

const PrizesTab = ({ campaign }) => {
  const { message } = App.useApp();
  const { data, isLoading } = useGetCampaignPrizes(campaign.id);
  const { mutateAsync: deletePrize, isPending: deleting } =
    useDeleteCampaignPrize();
  const prizes = data?.data?.prizes ?? [];
  const [prizeModal, setPrizeModal] = useState({ open: false, record: null });

  const handleDelete = async (prize) => {
    try {
      await deletePrize({ campaignId: campaign.id, prizeId: prize.id });
      message.success("Prize deleted.");
    } catch (err) {
      if (err?.response?.status === 409) {
        message.warning(
          err?.response?.data?.message ||
            "Cannot delete — claims exist. Set inactive instead.",
        );
      } else {
        message.error(err?.message || "Delete failed.");
      }
    }
  };

  if (isLoading)
    return (
      <div className="flex justify-center py-10">
        <Spin />
      </div>
    );

  return (
    <>
      <div className="flex justify-between mb-3">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setPrizeModal({ open: true, record: null })}
          style={{ background: "#E94560", borderColor: "#E94560" }}
        >
          Add Prize
        </Button>
      </div>

      {prizes.length === 0 ? (
        <Empty description="No prizes yet" />
      ) : (
        <Table
          scroll={{ x: 480 }}
          dataSource={prizes}
          columns={[
            {
              title: "Prize Name",
              dataIndex: "prizeName",
              key: "prizeName",
              render: (v) => (
                <span className="font-semibold" style={{ color: "#fff" }}>
                  {v}
                </span>
              ),
            },
            {
              title: "Qty",
              dataIndex: "quantity",
              key: "quantity",
              width: 65,
              render: (v) => (
                <span className="font-bold" style={{ color: "#E94560" }}>
                  {v}
                </span>
              ),
            },
            {
              title: "Order",
              dataIndex: "sortOrder",
              key: "sortOrder",
              width: 70,
            },
            {
              title: "Status",
              dataIndex: "isActive",
              key: "isActive",
              width: 90,
              render: (v) =>
                v !== false && v !== 0 ? (
                  <Tag color="success">Active</Tag>
                ) : (
                  <Tag>Inactive</Tag>
                ),
            },
            {
              title: "Actions",
              key: "actions",
              width: 90,
              render: (_, record) => (
                <Space size={2}>
                  <Tooltip title="Edit">
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined style={{ color: "#8892A4" }} />}
                      onClick={() => setPrizeModal({ open: true, record })}
                    />
                  </Tooltip>
                  <Tooltip title="Delete">
                    <Popconfirm
                      title="Delete this prize?"
                      description="Blocked if claims exist. Set inactive instead."
                      okText="Delete"
                      okButtonProps={{ danger: true, loading: deleting }}
                      onConfirm={() => handleDelete(record)}
                    >
                      <Button
                        type="text"
                        size="small"
                        icon={<DeleteOutlined style={{ color: "#E94560" }} />}
                      />
                    </Popconfirm>
                  </Tooltip>
                </Space>
              ),
            },
          ]}
          rowKey="id"
          size="small"
          pagination={false}
        />
      )}

      <PrizeFormModal
        open={prizeModal.open}
        onClose={() => setPrizeModal({ open: false, record: null })}
        campaignId={campaign.id}
        initialValues={prizeModal.record}
      />
    </>
  );
};

// ─── Mechanics Tab ────────────────────────────────────────────────────────────

const STEPS = [
  {
    n: 1,
    title: "Scan Booth QR",
    color: "#4096ff",
    detail: (c) => (
      <>
        Each booth awards its configured pts.
        {c.firstScanBonus > 0 && (
          <span className="ml-1 font-bold" style={{ color: "#F5A623" }}>
            +{c.firstScanBonus} pts 1st-scan bonus on first ever booth scan.
          </span>
        )}
      </>
    ),
  },
  {
    n: 2,
    title: "Collect Points",
    color: "#7360F2",
    detail: (c) => (
      <>
        Participant accumulates points across all booths. Reach{" "}
        <span className="font-black" style={{ color: "#E94560" }}>
          {c.thresholdPoints} pts
        </span>{" "}
        to unlock the raffle.
      </>
    ),
  },
  {
    n: 3,
    title: "Generate Raffle QR",
    color: "#00D68F",
    detail: () =>
      "Once threshold is met, participant generates an encrypted raffle QR from the visitor app.",
  },
  {
    n: 4,
    title: "Staff Validates QR",
    color: "#F5A623",
    detail: () =>
      "Event staff scans the raffle QR at the redemption booth to create a verified raffle entry.",
  },
  {
    n: 5,
    title: "Spin the Wheel",
    color: "#E94560",
    detail: (c) => (
      <>
        Participant spins the prize wheel.{" "}
        <span className="font-bold" style={{ color: "#fff" }}>
          Max {c.maxSpinsPerParticipant ?? 1} spin
          {(c.maxSpinsPerParticipant ?? 1) !== 1 ? "s" : ""} per participant.
        </span>
      </>
    ),
  },
];

// ─── Image Maps Tab ───────────────────────────────────────────────────────────

const ImageUploadModal = ({ open, onClose, campaignId, editImage }) => {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const { mutateAsync: uploadImage, isPending: uploading } =
    useUploadCampaignImage();
  const { mutateAsync: updateImage, isPending: updating } =
    useUpdateCampaignImage();
  const { mutateAsync: replaceImage, isPending: replacing } =
    useReplaceCampaignImage();
  const [fileList, setFileList] = useState([]);
  const isEditing = !!editImage;
  const saving = uploading || updating || replacing;

  const handleOpen = () => {
    setFileList([]);
    if (isEditing) {
      form.setFieldsValue({
        siteCode: editImage.siteCode,
        siteName: editImage.siteName,
        altText: editImage.altText ?? "",
        sortOrder: editImage.sortOrder,
        isActive: editImage.isActive,
      });
    } else {
      form.resetFields();
    }
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    try {
      if (isEditing) {
        // If a new file was chosen → replace, then patch metadata separately
        if (fileList.length > 0) {
          const fd = new FormData();
          fd.append("image", fileList[0].originFileObj);
          await replaceImage({
            campaignId,
            imageId: editImage.id,
            formData: fd,
          });
        }
        await updateImage({ campaignId, imageId: editImage.id, ...values });
        message.success("Image updated.");
      } else {
        if (fileList.length === 0) {
          message.error("Please select an image file.");
          return;
        }
        const fd = new FormData();
        fd.append("image", fileList[0].originFileObj);
        fd.append("siteCode", values.siteCode);
        fd.append("siteName", values.siteName);
        if (values.altText) fd.append("altText", values.altText);
        fd.append("sortOrder", String(values.sortOrder ?? 1));
        fd.append("isActive", String(values.isActive ?? true));
        await uploadImage({ campaignId, formData: fd });
        message.success("Image uploaded.");
      }
      onClose();
    } catch (err) {
      message.error(err?.message || "Failed to save image.");
    }
  };

  return (
    <Modal
      open={open}
      title={isEditing ? "Edit Image" : "Upload Image"}
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
          {isEditing ? "Save Changes" : "Upload"}
        </Button>,
      ]}
      width="min(520px, 95vw)"
      destroyOnHidden
    >
      <Form form={form} layout="vertical" className="pt-2">
        <Form.Item label={isEditing ? "Replace File (optional)" : "Image File"}>
          <Upload
            accept="image/*"
            maxCount={1}
            fileList={fileList}
            beforeUpload={() => false}
            onChange={({ fileList: fl }) => setFileList(fl)}
            listType="picture"
          >
            <Button icon={<UploadOutlined />}>
              {isEditing ? "Choose new file…" : "Choose file…"}
            </Button>
          </Upload>
          {isEditing && editImage?.imageUrl && fileList.length === 0 && (
            <div className="mt-2">
              <Image
                src={`${IMG_BASE}/${editImage.imageUrl}`}
                height={64}
                style={{ borderRadius: 6, objectFit: "cover" }}
                preview={{ mask: "Preview" }}
              />
            </div>
          )}
        </Form.Item>
        <div className="grid grid-cols-2 gap-x-4">
          <Form.Item
            label="Site Code"
            name="siteCode"
            rules={[{ required: true, message: "Required" }]}
          >
            <Input placeholder="MAIN-HALL" />
          </Form.Item>
          <Form.Item
            label="Site Name"
            name="siteName"
            rules={[{ required: true, message: "Required" }]}
          >
            <Input placeholder="Main Hall" />
          </Form.Item>
        </div>
        <Form.Item label="Alt Text" name="altText">
          <Input placeholder="Optional description for accessibility" />
        </Form.Item>
        <div className="grid grid-cols-2 gap-x-4">
          <Form.Item label="Sort Order" name="sortOrder" initialValue={1}>
            <InputNumber min={1} className="w-full" />
          </Form.Item>
          <Form.Item label="Status" name="isActive" initialValue={true}>
            <Select
              options={[
                { value: true, label: "Active" },
                { value: false, label: "Inactive" },
              ]}
            />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
};

const ImageMapsTab = ({ campaign }) => {
  const { message } = App.useApp();
  const { data, isLoading } = useGetCampaignImages(campaign.id);
  const { mutateAsync: deleteImage, isPending: deleting } =
    useDeleteCampaignImage();
  const sites = data?.data?.imageSites ?? [];
  const [imgModal, setImgModal] = useState({ open: false, record: null });

  const handleDelete = async (img) => {
    try {
      await deleteImage({ campaignId: campaign.id, imageId: img.id });
      message.success("Image deleted.");
    } catch (err) {
      message.error(err?.message || "Delete failed.");
    }
  };

  if (isLoading)
    return (
      <div className="flex justify-center py-10">
        <Spin />
      </div>
    );

  return (
    <>
      <div className="flex justify-between mb-4">
        <Button
          type="primary"
          icon={<UploadOutlined />}
          onClick={() => setImgModal({ open: true, record: null })}
          style={{ background: "#E94560", borderColor: "#E94560" }}
        >
          Upload Image
        </Button>
      </div>

      {sites.length === 0 ? (
        <Empty description="No images yet" />
      ) : (
        <div className="space-y-5">
          {sites.map((site) => (
            <div key={site.siteCode}>
              {/* Site header */}
              <div className="flex items-center gap-2 mb-2">
                <Tag color="blue" className="font-mono font-bold">
                  {site.siteCode}
                </Tag>
                <span
                  className="text-sm font-semibold"
                  style={{ color: "#fff" }}
                >
                  {site.siteName}
                </span>
                <span className="text-xs" style={{ color: "#8892A4" }}>
                  ({site.images.length} image
                  {site.images.length !== 1 ? "s" : ""})
                </span>
              </div>

              {/* Image cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {site.images.map((img) => (
                  <div
                    key={img.id}
                    className="flex gap-3 rounded-xl p-3"
                    style={{
                      background: "#0F1629",
                      border: "1px solid #16213E",
                    }}
                  >
                    {/* Thumbnail */}
                    <div
                      className="w-16 h-16 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
                      style={{ background: "#16213E" }}
                    >
                      <Image
                        src={`${IMG_BASE}/${img.imageUrl}`}
                        width={64}
                        height={64}
                        style={{ objectFit: "cover" }}
                        preview={{ mask: <EyeOutlined /> }}
                        fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0">
                          <p
                            className="text-xs font-mono truncate"
                            style={{ color: "#8892A4" }}
                          >
                            #{img.id} · order {img.sortOrder}
                          </p>
                          {img.altText && (
                            <p
                              className="text-xs truncate mt-0.5"
                              style={{ color: "#fff" }}
                            >
                              {img.altText}
                            </p>
                          )}
                        </div>
                        <Tag
                          color={img.isActive !== false ? "success" : "default"}
                          className="shrink-0 text-xs"
                        >
                          {img.isActive !== false ? "Active" : "Inactive"}
                        </Tag>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 mt-2">
                        <Tooltip title="Edit / Replace">
                          <Button
                            type="text"
                            size="small"
                            icon={<SwapOutlined style={{ color: "#8892A4" }} />}
                            onClick={() =>
                              setImgModal({ open: true, record: img })
                            }
                          />
                        </Tooltip>
                        <Tooltip title="Delete">
                          <Popconfirm
                            title="Delete this image?"
                            description="The file will be permanently removed."
                            okText="Delete"
                            okButtonProps={{ danger: true, loading: deleting }}
                            onConfirm={() => handleDelete(img)}
                          >
                            <Button
                              type="text"
                              size="small"
                              icon={
                                <DeleteOutlined style={{ color: "#E94560" }} />
                              }
                            />
                          </Popconfirm>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <ImageUploadModal
        open={imgModal.open}
        onClose={() => setImgModal({ open: false, record: null })}
        campaignId={campaign.id}
        editImage={imgModal.record}
      />
    </>
  );
};

// ─── Mechanics Tab ────────────────────────────────────────────────────────────

const MechanicsTab = ({ campaign }) => (
  <div className="space-y-3">
    {/* Summary chips */}
    <div className="flex flex-wrap gap-2 mb-4">
      {[
        {
          label: "Threshold",
          value: `${campaign.thresholdPoints} pts`,
          color: "#E94560",
        },
        {
          label: "1st Scan Bonus",
          value:
            campaign.firstScanBonus > 0
              ? `+${campaign.firstScanBonus} pts`
              : "Off",
          color: campaign.firstScanBonus > 0 ? "#F5A623" : "#8892A4",
        },
        {
          label: "Max Spins",
          value: campaign.maxSpinsPerParticipant ?? 1,
          color: "#7360F2",
        },
      ].map(({ label, value, color }) => (
        <div
          key={label}
          className="flex items-center gap-2 rounded-xl px-3 py-2"
          style={{ background: "#0F1629", border: `1px solid ${color}30` }}
        >
          <span className="text-xs" style={{ color: "#8892A4" }}>
            {label}
          </span>
          <span className="font-black text-sm" style={{ color }}>
            {value}
          </span>
        </div>
      ))}
    </div>

    {/* Steps */}
    {STEPS.map((step, i) => (
      <div key={step.n} className="flex gap-3">
        {/* Connector column */}
        <div className="flex flex-col items-center">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-black text-sm"
            style={{
              background: `${step.color}20`,
              color: step.color,
              border: `2px solid ${step.color}40`,
            }}
          >
            {step.n}
          </div>
          {i < STEPS.length - 1 && (
            <div
              className="w-0.5 flex-1 mt-1"
              style={{ background: "#16213E" }}
            />
          )}
        </div>

        {/* Content */}
        <div
          className="flex-1 rounded-xl px-4 py-3 mb-3"
          style={{
            background: "#16213E",
            borderLeft: `3px solid ${step.color}`,
          }}
        >
          <p className="font-bold text-sm mb-1" style={{ color: "#fff" }}>
            {step.title}
          </p>
          <p className="text-xs leading-relaxed" style={{ color: "#8892A4" }}>
            {step.detail(campaign)}
          </p>
        </div>
      </div>
    ))}
  </div>
);

const CampaignDetailDrawer = ({ campaign, open, onClose }) => {
  if (!campaign) return null;
  const { color, label } = STATUS_META[campaign.status] ?? {
    color: "default",
    label: campaign.status,
  };

  return (
    <Drawer
      title={
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold">{campaign.campaignName}</span>
          <Tag color={color}>{label}</Tag>
        </div>
      }
      open={open}
      onClose={onClose}
      size={
        typeof window !== "undefined" ? Math.min(1000, window.innerWidth) : 1000
      }
      destroyOnHidden
    >
      <Descriptions
        column={{ xs: 1, sm: 2 }}
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
            label: "Prizes",
            children: <PrizesTab campaign={campaign} />,
          },
          {
            key: "images",
            label: "Image Maps",
            children: <ImageMapsTab campaign={campaign} />,
          },
          {
            key: "mechanics",
            label: "Mechanics",
            children: <MechanicsTab campaign={campaign} />,
          },
        ]}
      />
    </Drawer>
  );
};

// ─── Campaign Card ────────────────────────────────────────────────────────────

const CampaignCard = ({ campaign, onView, onEdit, onDelete, deleting }) => {
  const { message } = App.useApp();
  const { color, label } = STATUS_META[campaign.status] ?? {
    color: "default",
    label: campaign.status,
  };
  const accent = STATUS_ACCENT[campaign.status] ?? "#E94560";

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col transition-transform hover:-translate-y-0.5"
      style={{ background: "#16213E", border: `1px solid ${accent}30` }}
    >
      {/* Status accent strip */}
      <div className="h-1 shrink-0" style={{ background: accent }} />

      {/* Card body */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p
              className="font-black text-base leading-snug"
              style={{ color: "#fff" }}
            >
              {campaign.campaignName}
            </p>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <Text
                code
                className="text-xs !bg-[#0F1629] !border-[#0F1629] !text-[#8892A4]"
              >
                {campaign.campaignCode}
              </Text>
              <Tag color="blue" className="font-mono font-bold text-xs m-0">
                {campaign.eventTag}
              </Tag>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Tag color={color} className="m-0">
              {label}
            </Tag>
            <span className="text-xs" style={{ color: "#8892A450" }}>
              #{campaign.id}
            </span>
          </div>
        </div>

        {/* 1st scan bonus badge */}
        {campaign.firstScanBonus > 0 && (
          <div
            className="flex items-center gap-1.5 self-start rounded-full px-2.5 py-1"
            style={{ background: "#F5A62318", border: "1px solid #F5A62340" }}
          >
            <Zap size={10} color="#F5A623" />
            <span className="text-xs font-bold" style={{ color: "#F5A623" }}>
              +{campaign.firstScanBonus} pts 1st scan bonus
            </span>
          </div>
        )}

        {/* Description */}
        {campaign.description && (
          <p
            className="text-xs leading-relaxed line-clamp-2"
            style={{ color: "#8892A4" }}
          >
            {campaign.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex flex-col gap-2 mt-auto">
          {/* Threshold */}
          <div
            className="flex items-center justify-between rounded-xl px-3 py-2.5"
            style={{ background: "#0F1629" }}
          >
            <span className="text-xs" style={{ color: "#8892A4" }}>
              Threshold
            </span>
            <span className="font-black text-sm" style={{ color: "#E94560" }}>
              {campaign.thresholdPoints} pts
            </span>
          </div>
          {/* Duration */}
          <div
            className="rounded-xl px-3 py-3 flex flex-col gap-1"
            style={{ background: "#0F1629" }}
          >
            <span className="text-xs" style={{ color: "#8892A4" }}>
              Duration
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm" style={{ color: "#fff" }}>
                {fmtDate(campaign.startDate)}
              </span>
              <span className="text-xs" style={{ color: "#8892A4" }}>
                →
              </span>
              <span className="font-semibold text-sm" style={{ color: "#fff" }}>
                {fmtDate(campaign.endDate)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions footer */}
      <div
        className="px-4 py-3 flex items-center gap-2"
        style={{ borderTop: `1px solid ${accent}18` }}
      >
        <button
          onClick={() => onView(campaign)}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-opacity hover:opacity-80 active:scale-95"
          style={{
            background: `${accent}15`,
            color: accent,
            border: `1px solid ${accent}25`,
          }}
        >
          <EyeOutlined style={{ fontSize: 12 }} />
          Booths & QR
        </button>
        <Tooltip title={`Copy link: /${campaign.eventTag}`} color="#E94560">
          <button
            onClick={() => {
              copyText(`${window.location.origin}/${campaign.eventTag}`)
                .then(() => message.success("Link copied!"))
                .catch(() => message.error("Copy failed."));
            }}
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-opacity hover:opacity-80 active:scale-95"
            style={{ background: "#0F1629", border: "1px solid #ffffff10" }}
          >
            <CopyOutlined style={{ fontSize: 13, color: "#8892A4" }} />
          </button>
        </Tooltip>
        <Tooltip title="Edit">
          <button
            onClick={() => onEdit(campaign)}
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-opacity hover:opacity-80 active:scale-95"
            style={{ background: "#0F1629", border: "1px solid #ffffff10" }}
          >
            <EditOutlined style={{ fontSize: 13, color: "#8892A4" }} />
          </button>
        </Tooltip>
        {campaign.status === "draft" && (
          <Tooltip title="Delete draft">
            <Popconfirm
              title="Delete this event?"
              description="This cannot be undone."
              okText="Delete"
              okButtonProps={{ danger: true, loading: deleting }}
              onConfirm={() => onDelete(campaign.id)}
            >
              <button
                className="w-8 h-8 flex items-center justify-center rounded-xl transition-opacity hover:opacity-80 active:scale-95"
                style={{
                  background: "#E9456015",
                  border: "1px solid #E9456025",
                }}
              >
                <DeleteOutlined style={{ fontSize: 13, color: "#E94560" }} />
              </button>
            </Popconfirm>
          </Tooltip>
        )}
      </div>
    </div>
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

  return (
    <div className="min-h-full" style={{ background: "#0F1629" }}>
      {/* Header */}
      <div
        className="px-4 pt-4 pb-4 sm:px-6 sm:pt-6 sm:pb-5"
        style={{ borderBottom: "1px solid #16213E" }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "#E9456020" }}
            >
              <Megaphone color="#E94560" size={20} />
            </div>
            <div className="min-w-0">
              <h1
                className="font-black text-lg leading-none truncate"
                style={{ color: "#fff" }}
              >
                Event Manager
              </h1>
              <p
                className="text-xs mt-0.5 hidden sm:block"
                style={{ color: "#8892A4" }}
              >
                Manage raffle events and generate booth QR codes
              </p>
            </div>
          </div>
          <Space size={6}>
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
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreate}
              style={{ background: "#E94560", borderColor: "#E94560" }}
            >
              <span className="hidden sm:inline">New Event</span>
            </Button>
          </Space>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
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

      {/* Cards */}
      <div className="p-3 sm:p-6">
        {isLoading ? (
          <div className="flex justify-center py-24">
            <Spin size="large" />
          </div>
        ) : campaigns.length === 0 ? (
          <Empty
            description={
              <span style={{ color: "#8892A4" }}>No events yet</span>
            }
            className="py-24"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {campaigns.map((c) => (
              <CampaignCard
                key={c.id}
                campaign={c}
                onView={setDrawerTarget}
                onEdit={openEdit}
                onDelete={handleDelete}
                deleting={deleting}
              />
            ))}
          </div>
        )}
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
