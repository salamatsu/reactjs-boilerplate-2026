import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Form,
  Input,
  Modal,
  Switch,
  Table,
  Tag,
  Typography,
} from "antd";
import { useState } from "react";

const { Title } = Typography;

let nextId = 6;

const INITIAL_ITEMS = [
  { id: 1, name: "Item Alpha",   description: "First sample item",  category: "Hardware", active: true  },
  { id: 2, name: "Item Beta",    description: "Second sample item", category: "Software", active: true  },
  { id: 3, name: "Item Gamma",   description: "Third sample item",  category: "Hardware", active: false },
  { id: 4, name: "Item Delta",   description: "Fourth sample item", category: "Service",  active: true  },
  { id: 5, name: "Item Epsilon", description: "Fifth sample item",  category: "Software", active: false },
];

// ── Inline-editable text cell ────────────────────────────────────────────────
function InlineCell({ record, field, onCommit }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(record[field]);

  const commit = () => {
    setEditing(false);
    if (val !== record[field]) onCommit(record.id, field, val);
  };

  if (editing) {
    return (
      <Input
        autoFocus
        size="small"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={commit}
        onPressEnter={commit}
        onKeyDown={(e) => {
          if (e.key === "Escape") { setVal(record[field]); setEditing(false); }
        }}
        style={{ width: "100%" }}
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      title="Click to edit"
      style={{ cursor: "text", display: "block", minHeight: "22px" }}
      className="hover:text-blue-600 hover:underline transition-colors"
    >
      {record[field] || <span style={{ color: "#bbb", fontStyle: "italic" }}>—</span>}
    </span>
  );
}

export default function Items() {
  const { message, modal } = App.useApp();
  const [items, setItems] = useState(INITIAL_ITEMS);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = add, object = edit
  const [form] = Form.useForm();

  // ── Inline edit ──────────────────────────────────────────────────────────
  const commitInline = (id, field, value) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
    message.success("Updated.");
  };

  // ── Modal ────────────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleSave = () => {
    form
      .validateFields()
      .then((values) => {
        if (editing) {
          setItems((prev) =>
            prev.map((item) =>
              item.id === editing.id ? { ...item, ...values } : item
            )
          );
          message.success("Item updated.");
        } else {
          setItems((prev) => [
            ...prev,
            { id: nextId++, active: true, ...values },
          ]);
          message.success("Item added.");
        }
        setModalOpen(false);
        form.resetFields();
      })
      .catch(() => {});
  };

  // ── Toggle status ────────────────────────────────────────────────────────
  const toggleStatus = (record) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === record.id ? { ...item, active: !item.active } : item
      )
    );
    message.success(
      `"${record.name}" is now ${record.active ? "inactive" : "active"}.`
    );
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = (record) => {
    modal.confirm({
      title: `Delete "${record.name}"?`,
      content: "This action cannot be undone.",
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: () => {
        setItems((prev) => prev.filter((item) => item.id !== record.id));
        message.success("Item deleted.");
      },
    });
  };

  // ── Columns ──────────────────────────────────────────────────────────────
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 60,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (_, record) => (
        <InlineCell record={record} field="name" onCommit={commitInline} />
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (_, record) => (
        <InlineCell record={record} field="description" onCommit={commitInline} />
      ),
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      width: 130,
      render: (_, record) => (
        <InlineCell record={record} field="category" onCommit={commitInline} />
      ),
    },
    {
      title: "Status",
      dataIndex: "active",
      key: "active",
      width: 130,
      render: (active, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Switch
            size="small"
            checked={active}
            onChange={() => toggleStatus(record)}
          />
          <Tag color={active ? "green" : "default"}>
            {active ? "Active" : "Inactive"}
          </Tag>
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 90,
      render: (_, record) => (
        <div style={{ display: "flex", gap: "8px" }}>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => openEdit(record)}
          />
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            onClick={() => handleDelete(record)}
          />
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "8px",
        }}
      >
        <Title level={3} style={{ color: "#1E3A71", margin: 0 }}>
          Items
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
          Add Item
        </Button>
      </div>

      <p style={{ color: "#888", fontSize: "13px", marginBottom: "16px" }}>
        Click any <strong>Name</strong>, <strong>Description</strong>, or{" "}
        <strong>Category</strong> cell to edit inline.
      </p>

      <Table
        dataSource={items}
        columns={columns}
        rowKey="id"
        bordered
        pagination={{ pageSize: 10, showSizeChanger: false }}
      />

      {/* Add / Edit Modal */}
      <Modal
        title={editing ? "Edit Item" : "Add Item"}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        okText={editing ? "Save Changes" : "Add Item"}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: "16px" }}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Name is required" }]}
          >
            <Input placeholder="Item name" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Brief description" />
          </Form.Item>
          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: "Category is required" }]}
          >
            <Input placeholder="e.g. Hardware, Software, Service" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
