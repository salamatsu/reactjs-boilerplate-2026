import { Button, Card, Tag, Typography } from "antd";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { APP_NAME } from "../lib/constants";

const { Title, Paragraph, Text } = Typography;

const PRIMARY = "#1E3A71";

const FEATURES = [
  {
    icon: "🔐",
    title: "Public Registration",
    desc: "Open form at /register. Calls POST /api/v1/public/register via usePublicRegister() — no auth required.",
    tag: "Public",
    tagColor: "green",
  },
  {
    icon: "🛡️",
    title: "Admin Login & RBAC",
    desc: "JWT login via POST /api/v1/auth/login. Tokens stored in Zustand. Role-based page access (ADMIN / STAFF).",
    tag: "Auth",
    tagColor: "blue",
  },
  {
    icon: "🔄",
    title: "Token Refresh & Logout",
    desc: "Refresh: POST /api/v1/auth/refresh { refreshToken }. Logout: POST /api/v1/auth/logout { refreshToken }. Auto-refresh fires on 401 via Axios interceptor.",
    tag: "Auth",
    tagColor: "blue",
  },
  {
    icon: "👤",
    title: "Current User Profile",
    desc: "GET /api/v1/auth/me?hashMe=... fetches the authenticated user's profile. Hook: useGetMe(hashMe).",
    tag: "Auth",
    tagColor: "blue",
  },
  {
    icon: "📋",
    title: "Attendees List",
    desc: "GET /api/v1/cms/attendees/attendees with params: page, limit, sortBy, sortOrder, eventId, category, search. Hook: useGetAttendees(params).",
    tag: "Protected",
    tagColor: "purple",
  },
  {
    icon: "🔍",
    title: "Attendee Detail",
    desc: "GET /api/v1/cms/attendees/attendees/:id returns full record including event info, QR code, and transaction status.",
    tag: "Protected",
    tagColor: "purple",
  },
  {
    icon: "📥",
    title: "Export Attendees",
    desc: "GET /api/v1/cms/attendees/export returns the full unpaginated list. Hook: useExportAttendees() — downloads as CSV.",
    tag: "Protected",
    tagColor: "purple",
  },
  {
    icon: "📊",
    title: "Admin Dashboard",
    desc: "Protected route at /admin/dashboard. Shows live attendee count and item stats. Redirects to login if unauthenticated.",
    tag: "Protected",
    tagColor: "purple",
  },
  {
    icon: "⚡",
    title: "React Query",
    desc: "All server state via @tanstack/react-query v5. useQuery for reads, useMutation for writes, cache invalidation on success.",
    tag: "Pattern",
    tagColor: "orange",
  },
  {
    icon: "🌐",
    title: "Axios + Interceptors",
    desc: "Public instance (no auth) and authenticated instance (Bearer token + CSRF). Auto token-refresh on 401, auto CSRF-refresh on 403.",
    tag: "Pattern",
    tagColor: "orange",
  },
  {
    icon: "🔒",
    title: "CSRF Protection",
    desc: "Token fetched from GET /api/v1/auth/csrf-token on mount, stored in Zustand, injected on POST/PATCH via x-csrf-token header.",
    tag: "Security",
    tagColor: "red",
  },
  {
    icon: "🗄️",
    title: "Zustand Stores",
    desc: "useAdminAuthStore (userData, token, refreshToken) and useCsrfStore — both persisted to localStorage.",
    tag: "State",
    tagColor: "cyan",
  },
];

const PATTERNS = [
  {
    label: "Add a new API resource",
    steps: [
      "Define async functions in src/services/api/api.js",
      "Add useQuery / useMutation hooks in src/services/requests/useApi.js",
      "Consume the hook in your page component",
    ],
  },
  {
    label: "Add a new admin page",
    steps: [
      "Create the page in src/pages/admin/",
      "Lazy-import it in src/routes/pageRoutes/AdminRoute.jsx",
      "Add an entry to the navigations array with route, label, icon, component",
    ],
  },
  {
    label: "Protect a route",
    steps: [
      "Wrap with <Auth store={useAdminAuthStore} redirect='/admin' /> to require login",
      "Wrap with <UnAuth store={useAdminAuthStore} redirect='/admin/dashboard' /> to block logged-in users",
    ],
  },
  {
    label: "Handle authenticated requests",
    steps: [
      "Use createAxiosInstanceWithInterceptor('data') for JSON or 'multipart' for file uploads",
      "Bearer token is injected automatically from useCurrentActiveUserToken store",
      "On 401, the interceptor auto-calls POST /api/v1/auth/refresh { refreshToken } and retries",
    ],
  },
  {
    label: "Attendees page pattern",
    steps: [
      "useGetAttendees(params) — paginated list with filters (eventId, category, search, sortBy)",
      "useGetAttendeeById(id) — single record for a detail drawer",
      "useExportAttendees() — mutation that returns full list; caller builds and downloads CSV",
    ],
  },
  {
    label: "Logout flow",
    steps: [
      "Call useLogoutAdminAuth() mutation — reads refreshToken from store, sends POST /api/v1/auth/logout",
      "onSuccess resets both useAdminAuthStore and useCurrentActiveUserToken",
      "Auth guard redirects to /admin login on next navigation",
    ],
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.06 },
  }),
};

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7ff" }}>
      {/* ── Header ─────────────────────────────────── */}
      <header
        style={{
          backgroundColor: PRIMARY,
          padding: "0 32px",
          height: "56px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 100,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}
      >
        <Title level={4} style={{ color: "#fff", margin: 0, letterSpacing: "0.5px" }}>
          {APP_NAME}
        </Title>
        <Button ghost onClick={() => navigate("/admin")}>
          Admin Login
        </Button>
      </header>

      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px 80px" }}>

        {/* ── Hero ───────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          style={{ textAlign: "center", padding: "80px 0 60px" }}
        >
          <Tag color="blue" style={{ marginBottom: "16px", fontSize: "13px", padding: "2px 12px" }}>
            React Boilerplate
          </Tag>
          <Title style={{ color: PRIMARY, fontSize: "clamp(32px, 5vw, 52px)", marginBottom: "16px" }}>
            Welcome to {APP_NAME}
          </Title>
          <Paragraph style={{ fontSize: "17px", color: "#555", maxWidth: "580px", margin: "0 auto 36px" }}>
            Production-ready starter — public registration, secured admin dashboard,
            React Query data fetching, Axios with CSRF &amp; JWT auto-refresh,
            and a full attendees management module.
          </Paragraph>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Button
              type="primary"
              size="large"
              onClick={() => navigate("/register")}
              style={{ height: "46px", padding: "0 28px", fontSize: "15px" }}
            >
              Register Now
            </Button>
            <Button
              size="large"
              onClick={() => navigate("/admin")}
              style={{ height: "46px", padding: "0 28px", fontSize: "15px" }}
            >
              Admin Login
            </Button>
          </div>
        </motion.section>

        {/* ── Features ───────────────────────────────── */}
        <section style={{ marginBottom: "72px" }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            style={{ textAlign: "center", marginBottom: "36px" }}
          >
            <Title level={2} style={{ color: PRIMARY }}>Features</Title>
            <Paragraph style={{ color: "#666", fontSize: "15px" }}>
              Every endpoint wired up — auth, attendees, export, and CRUD templates.
            </Paragraph>
          </motion.div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "20px",
            }}
          >
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
              >
                <Card
                  className="hover:shadow-lg transition-shadow"
                  style={{ height: "100%", borderTop: `3px solid ${PRIMARY}` }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <span style={{ fontSize: "28px", lineHeight: 1 }}>{f.icon}</span>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                        <Text strong style={{ fontSize: "15px", color: PRIMARY }}>{f.title}</Text>
                        <Tag color={f.tagColor} style={{ fontSize: "11px" }}>{f.tag}</Tag>
                      </div>
                      <Paragraph style={{ color: "#555", margin: 0, fontSize: "13.5px" }}>
                        {f.desc}
                      </Paragraph>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Patterns ───────────────────────────────── */}
        <section style={{ marginBottom: "64px" }}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            style={{ textAlign: "center", marginBottom: "36px" }}
          >
            <Title level={2} style={{ color: PRIMARY }}>Patterns</Title>
            <Paragraph style={{ color: "#666", fontSize: "15px" }}>
              Common workflows — follow these to stay consistent across the codebase.
            </Paragraph>
          </motion.div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "20px",
            }}
          >
            {PATTERNS.map((p, i) => (
              <motion.div
                key={p.label}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
              >
                <Card
                  className="hover:shadow-lg transition-shadow"
                  style={{ height: "100%" }}
                  styles={{ header: { color: PRIMARY, fontWeight: 600 } }}
                  title={`${i + 1}. ${p.label}`}
                >
                  <ol style={{ paddingLeft: "18px", margin: 0 }}>
                    {p.steps.map((step) => (
                      <li key={step} style={{ color: "#444", fontSize: "13.5px", marginBottom: "6px" }}>
                        {step}
                      </li>
                    ))}
                  </ol>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Stack badges ───────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          style={{ textAlign: "center" }}
        >
          <Paragraph style={{ color: "#999", marginBottom: "12px", fontSize: "13px" }}>
            Built with
          </Paragraph>
          <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
            {[
              "React 19", "React Router v7", "React Query v5",
              "Axios", "Zustand", "Ant Design 6", "Tailwind CSS 4",
              "Framer Motion", "Vite 7",
            ].map((tech) => (
              <Tag key={tech} style={{ fontSize: "12px", padding: "2px 10px" }}>{tech}</Tag>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
