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
import { logo } from "../../assets/images/logos";

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
          "linear-gradient(135deg, #FFF7EE 0%, #FFF3E0 60%, #FFE4C2 100%)",
        padding: "20px",
      }}
    >
      <Card
        style={{
          maxWidth: "400px",
          width: "100%",
          background: "#ffffff",
          border: "1px solid rgba(253,145,20,0.2)",
          boxShadow: "0 4px 24px rgba(253,145,20,0.08)",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Brand header */}
          <div className="text-center mb-6">
            <img
              src={logo}
              className="m-auto"
              style={{
                maxWidth: 100,
              }}
            />
            <div className="flex items-center justify-center gap-2 mb-2">
              {/* <Zap size={28/} color="#fd9114" /> */}
              <Title level={3} style={{ color: "#1A1A2E", margin: 0 }}>
                Worldbex Scan2Win
              </Title>
            </div>
            <Paragraph style={{ color: "#6B7280", margin: 0, fontSize: 13 }}>
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
                prefix={<UserOutlined style={{ color: "#6B7280" }} />}
                placeholder="Username"
                size="large"
                onChange={() => setErrorMsg(null)}
                style={{
                  background: "#F8F9FA",
                  borderColor: "#fd9114",
                  color: "#1A1A2E",
                }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: "Password is required." }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: "#6B7280" }} />}
                placeholder="Password"
                size="large"
                onChange={() => setErrorMsg(null)}
                style={{
                  background: "#F8F9FA",
                  borderColor: "#fd9114",
                  color: "#1A1A2E",
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
                  background: "#fd9114",
                  borderColor: "#fd9114",
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
