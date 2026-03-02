import { Button, Result, Typography } from "antd";
import { HomeOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";

const { Paragraph } = Typography;

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #ffffff 0%, #667eea 100%)",
        padding: "20px",
      }}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Result
          status="404"
          title={
            <span
              style={{ color: "#fff", fontSize: "48px", fontWeight: "bold" }}
            >
              404
            </span>
          }
          subTitle={
            <Paragraph
              style={{ color: "#fff", fontSize: "18px", marginTop: "20px" }}
            >
              Oops! The page you're looking for doesn't exist.
            </Paragraph>
          }
          extra={[
            <Button
              type="primary"
              size="large"
              icon={<HomeOutlined />}
              onClick={() => navigate("/")}
              key="home"
              style={{
                marginRight: "10px",
                background: "#fff",
                color: "#667eea",
                borderColor: "#fff",
                fontWeight: "600",
              }}
            >
              Go Home
            </Button>,
            <Button
              size="large"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(-1)}
              key="back"
              style={{
                background: "transparent",
                color: "#fff",
                borderColor: "#fff",
                fontWeight: "600",
              }}
            >
              Go Back
            </Button>,
          ]}
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(10px)",
            borderRadius: "20px",
            padding: "60px 40px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
          }}
        />
      </motion.div>
    </motion.div>
  );
}
