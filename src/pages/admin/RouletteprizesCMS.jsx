// ============================================
// SCAN2WIN — Roulette Prize CMS
// Worldbex Events "Scan to Win" Platform
//
// Route: /admin/prizes
// Actor: Admin / Staff
//
// Features:
//   - List all prizes (card grid with pool badge)
//   - Add prize (modal form)
//   - Edit prize (pre-filled modal form)
//   - Delete prize (confirmation dialog)
// ============================================

import { useState } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Spin,
  Tag,
  Typography,
  Upload,
  message,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { Trophy } from "lucide-react";
import {
  useGetPrizes,
  useCreatePrize,
  useUpdatePrize,
  useDeletePrize,
} from "../../services/requests/useApi";

const { Title, Text } = Typography;

// ─── Prize Form Modal ─────────────────────────────────────────────────────────

/**
 * Add / Edit prize modal.
 * When `initialValues` is provided the form is in edit mode.
 */
const PrizeFormModal = ({ open, onClose, initialValues }) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);

  const { mutateAsync: createPrize, isPending: creating } = useCreatePrize();
  const { mutateAsync: updatePrize, isPending: updating } = useUpdatePrize();

  const isEditing = !!initialValues;
  const saving = creating || updating;

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("description", values.description);
      if (fileList.length) {
        formData.append("image", fileList[0].originFileObj);
      }

      if (isEditing) {
        formData.append("id", initialValues.id);
        await updatePrize(formData);
        message.success("Prize updated successfully.");
      } else {
        await createPrize(formData);
        message.success("Prize added successfully.");
      }

      form.resetFields();
      setFileList([]);
      onClose();
    } catch {
      // Validation errors or API errors are shown inline
    }
  };

  return (
    <Modal
      open={open}
      title={isEditing ? "Edit Prize" : "Add Prize"}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      onOk={handleSubmit}
      okText={saving ? "Saving…" : isEditing ? "Save Changes" : "Add Prize"}
      okButtonProps={{ loading: saving, style: { background: "#fd9114", borderColor: "#fd9114" } }}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={
          isEditing
            ? { name: initialValues.name, description: initialValues.description }
            : {}
        }
      >
        {/* Prize name */}
        <Form.Item
          name="name"
          label="Prize Name"
          rules={[{ required: true, message: "Prize name is required." }]}
        >
          <Input placeholder="e.g. Fuel Voucher ₱500" />
        </Form.Item>

        {/* Description */}
        <Form.Item
          name="description"
          label="Description"
          rules={[{ required: true, message: "Description is required." }]}
        >
          <Input.TextArea
            rows={3}
            placeholder="Short description of the prize…"
          />
        </Form.Item>

        {/* Image upload (optional) */}
        <Form.Item name="image" label="Prize Image (optional)">
          <Upload
            fileList={fileList}
            beforeUpload={() => false} // Prevent auto-upload; handled on submit
            onChange={({ fileList: newList }) => setFileList(newList)}
            accept="image/*"
            maxCount={1}
            listType="picture"
          >
            <Button icon={<UploadOutlined />}>Select Image</Button>
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
};

// ─── Delete Confirmation ──────────────────────────────────────────────────────

// Handled inline via Ant Design <Popconfirm> per prize card.

// ─── Prize Card ───────────────────────────────────────────────────────────────

const PrizeCard = ({ prize, onEdit, onDelete }) => (
  <Card
    size="small"
    className="rounded-2xl border border-gray-100 shadow-sm"
    cover={
      prize.image ? (
        <img
          src={prize.image}
          alt={prize.name}
          className="w-full h-32 object-cover rounded-t-2xl"
        />
      ) : (
        <div className="w-full h-32 bg-gray-50 flex items-center justify-center rounded-t-2xl">
          <Trophy size={32} className="text-gray-300" />
        </div>
      )
    }
    actions={[
      <Button
        key="edit"
        type="text"
        icon={<EditOutlined />}
        onClick={() => onEdit(prize)}
        aria-label={`Edit ${prize.name}`}
      >
        Edit
      </Button>,
      <Popconfirm
        key="delete"
        title="Delete this prize?"
        description="This action cannot be undone."
        onConfirm={() => onDelete(prize.id)}
        okText="Delete"
        okButtonProps={{ danger: true }}
        cancelText="Cancel"
      >
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          aria-label={`Delete ${prize.name}`}
        >
          Delete
        </Button>
      </Popconfirm>,
    ]}
  >
    <Card.Meta
      title={prize.name}
      description={
        <Space direction="vertical" size={4} className="w-full">
          <Text type="secondary" className="text-xs line-clamp-2">
            {prize.description}
          </Text>
          <Tag color={prize.isPool === 1 ? "green" : "default"}>
            {prize.isPool === 1 ? "In Prize Pool" : "Display Only"}
          </Tag>
        </Space>
      }
    />
  </Card>
);

// ─── Main CMS Page ────────────────────────────────────────────────────────────

const RouletteprizesCMS = () => {
  const { data: prizes = [], isLoading } = useGetPrizes();
  const { mutateAsync: deletePrize } = useDeletePrize();

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // Prize to edit, or null for add

  const openAdd = () => {
    setEditTarget(null);
    setModalOpen(true);
  };

  const openEdit = (prize) => {
    setEditTarget(prize);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await deletePrize(id);
      message.success("Prize deleted.");
    } catch {
      message.error("Failed to delete prize.");
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Title level={4} className="!mb-0">
            Roulette Prizes
          </Title>
          <Text type="secondary" className="text-xs">
            Manage prizes shown on the redemption roulette wheel.
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openAdd}
          style={{ background: "#fd9114", borderColor: "#fd9114" }}
          aria-label="Add new prize"
        >
          Add Prize
        </Button>
      </div>

      {/* Prize grid */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spin size="large" />
        </div>
      ) : prizes.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Trophy size={40} className="mx-auto mb-3 opacity-30" />
          <p>No prizes yet. Add your first prize above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {prizes.map((prize) => (
            <PrizeCard
              key={prize.id}
              prize={prize}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Add / Edit modal */}
      <PrizeFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialValues={editTarget}
      />
    </div>
  );
};

export default RouletteprizesCMS;
