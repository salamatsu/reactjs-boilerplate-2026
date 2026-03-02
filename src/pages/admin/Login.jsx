import { LockOutlined, UserOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Spin,
  Typography,
} from "antd";
import { motion } from "framer-motion";
import { useState } from "react";
import { useLoginAdminAuth } from "../../services/requests/useAuth";
import { APP_NAME } from "../../lib/constants";

const { Title, Paragraph } = Typography;

export default function Login() {
  const [form] = Form.useForm();
  const [errorMsg, setErrorMsg] = useState(null);
  const { mutate, isPending } = useLoginAdminAuth();

  const onFinish = (values) => {
    setErrorMsg(null);

    const modal = Modal.info({
      icon: null,
      content: (
        <div className="flex flex-col gap-2 text-center justify-center items-center py-2">
          <Spin />
          <span>Logging in...</span>
        </div>
      ),
      title: null,
      closable: false,
      footer: null,
      centered: true,
    });

    mutate(values, {
      onSuccess: () => {
        form.resetFields();
        modal.destroy();
      },
      onError: (error) => {
        modal.destroy();
        setErrorMsg(error?.message || "Invalid username or password.");
      },
    });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #ffffff 0%, #1E3A71 100%)",
        padding: "20px",
      }}
    >
      <Card style={{ maxWidth: "400px", width: "100%" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <Title level={3} style={{ color: "#1E3A71", marginBottom: "4px" }}>
              {APP_NAME}
            </Title>
            <Paragraph style={{ color: "#666", margin: 0 }}>
              Admin Portal — sign in to continue
            </Paragraph>
          </div>

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              style={{ marginBottom: "16px" }}
            >
              <Alert
                description={errorMsg}
                type="error"
                showIcon
                closable={{ onClose: () => setErrorMsg(null) }}
              />
            </motion.div>
          )}

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            disabled={isPending}
            initialValues={{ username: "admin", password: "Admin@123" }}
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: "Please enter your username" },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Username"
                size="large"
                onChange={() => setErrorMsg(null)}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: "Please enter your password" },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Password"
                size="large"
                onChange={() => setErrorMsg(null)}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={isPending}
              >
                Login
              </Button>
            </Form.Item>
          </Form>
        </motion.div>
      </Card>
    </div>
  );
}
