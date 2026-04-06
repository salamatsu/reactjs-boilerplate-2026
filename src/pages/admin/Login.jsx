// ============================================
// SCAN2WIN — Admin CMS Login
// Worldbex Events "Scan to Win" Platform
//
// Route: /admin  (unauthenticated only)
// Redirects to /admin/prizes on success.
// ============================================

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
import { Zap } from "lucide-react";
import { useLoginAdminAuth } from "../../services/requests/useAuth";

const { Title, Paragraph } = Typography;

const Login = () => {
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
          <span>Signing in…</span>
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
        background:
          "linear-gradient(135deg, #1A1A2E 0%, #16213E 60%, #E94560 200%)",
        padding: "20px",
      }}
    >
      <Card
        style={{
          maxWidth: "400px",
          width: "100%",
          background: "#16213E",
          border: "1px solid rgba(233,69,96,0.2)",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Brand header */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap size={28} color="#E94560" />
              <Title level={3} style={{ color: "#FFFFFF", margin: 0 }}>
                SCAN2WIN
              </Title>
            </div>
            <Paragraph style={{ color: "#8892A4", margin: 0, fontSize: 13 }}>
              Worldbex Events — Admin CMS
            </Paragraph>
          </div>

          {/* Error alert */}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="mb-4"
            >
              <Alert
                description={errorMsg}
                type="error"
                showIcon
                closable={{ onClose: () => setErrorMsg(null) }}
              />
            </motion.div>
          )}

          {/* Login form */}
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            disabled={isPending}
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: "Username is required." }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: "#8892A4" }} />}
                placeholder="Username"
                size="large"
                onChange={() => setErrorMsg(null)}
                style={{
                  background: "#1A1A2E",
                  borderColor: "#E94560",
                  color: "#fff",
                }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: "Password is required." }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: "#8892A4" }} />}
                placeholder="Password"
                size="large"
                onChange={() => setErrorMsg(null)}
                style={{
                  background: "#1A1A2E",
                  borderColor: "#E94560",
                  color: "#fff",
                }}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={isPending}
                style={{
                  background: "#E94560",
                  borderColor: "#E94560",
                  fontWeight: 700,
                }}
                aria-label="Sign in to admin CMS"
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>
        </motion.div>
      </Card>
    </div>
  );
};

export default Login;
