import { ArrowLeftOutlined, UserAddOutlined } from "@ant-design/icons";
import { App, Button, Card, Form, Input, Typography } from "antd";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { usePublicRegister } from "../services/requests/useApi";
import { APP_NAME } from "../lib/constants";

const { Title, Paragraph } = Typography;

export default function Register() {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { mutate, isPending } = usePublicRegister();

  const onFinish = (values) => {
    mutate(values, {
      onSuccess: () => {
        message.success("Registration successful! You will be contacted shortly.");
        form.resetFields();
      },
      onError: (error) => {
        message.error(error?.message || "Registration failed. Please try again.");
      },
    });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f0f5ff 0%, #e6f0ff 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: "100%", maxWidth: "480px" }}
      >
        <Card>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/")}
            style={{ marginBottom: "16px", padding: 0 }}
          >
            Back
          </Button>

          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <UserAddOutlined style={{ fontSize: "48px", color: "#1E3A71" }} />
            <Title level={3} style={{ color: "#1E3A71", marginTop: "16px" }}>
              Create an Account
            </Title>
            <Paragraph style={{ color: "#666" }}>
              Fill in the form below to register with {APP_NAME}.
            </Paragraph>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            disabled={isPending}
          >
            <Form.Item
              label="First Name"
              name="firstName"
              rules={[{ required: true, message: "Please enter your first name" }]}
            >
              <Input placeholder="First name" size="large" />
            </Form.Item>

            <Form.Item
              label="Last Name"
              name="lastName"
              rules={[{ required: true, message: "Please enter your last name" }]}
            >
              <Input placeholder="Last name" size="large" />
            </Form.Item>

            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Please enter your email" },
                { type: "email", message: "Please enter a valid email" },
              ]}
            >
              <Input placeholder="email@example.com" size="large" />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: "Please enter a password" },
                { min: 8, message: "Password must be at least 8 characters" },
              ]}
            >
              <Input.Password placeholder="Password" size="large" />
            </Form.Item>

            <Form.Item
              label="Confirm Password"
              name="confirmPassword"
              dependencies={["password"]}
              rules={[
                { required: true, message: "Please confirm your password" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("Passwords do not match"));
                  },
                }),
              ]}
            >
              <Input.Password placeholder="Confirm password" size="large" />
            </Form.Item>

            <Form.Item style={{ marginTop: "8px" }}>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={isPending}
              >
                Register
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: "center", marginTop: "8px" }}>
            <Paragraph style={{ color: "#999", fontSize: "13px", margin: 0 }}>
              Already have an account?{" "}
              <Button type="link" style={{ padding: 0 }} onClick={() => navigate("/admin")}>
                Admin Login
              </Button>
            </Paragraph>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
