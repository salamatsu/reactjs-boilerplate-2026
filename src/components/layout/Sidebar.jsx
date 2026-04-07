// ============================================
// SCAN2WIN — Admin CMS Sidebar
// Worldbex Events "Scan to Win" Platform
//
// Renders as a collapsible Sider on desktop (md+)
// and as a Drawer on mobile/tablet.
// Navigation items are passed in via props from CmsRoute.
// ============================================

import { LoginOutlined } from "@ant-design/icons";
import { App, Divider, Drawer, Layout, Menu } from "antd";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { Link, useLocation } from "react-router";
import { useWindowSize } from "../../hooks/useWindowSize";
import { generateItems, getItem } from "../../utils/itemFormat";

const { Sider } = Layout;

/** Renders the main navigation menu items */
const TopMenus = ({ path, navigations = [], handleCollapse = () => {} }) => (
  <Menu
    className="flex-1"
    mode="inline"
    items={generateItems(navigations)}
    defaultSelectedKeys={[path]}
    selectedKeys={[path]}
    onClick={handleCollapse}
  />
);

/** Brand logo / wordmark shown at top of sidebar */
const Brand = ({ collapsed }) => (
  <div
    className="flex items-center justify-center gap-2 py-5 px-4"
    style={{ borderBottom: "1px solid rgba(233,69,96,0.15)" }}
  >
    <Zap size={20} color="#E94560" />
    {!collapsed && (
      <span className="font-black tracking-widest text-sm text-[#E94560]">
        Worldbex Scan2Win
      </span>
    )}
  </div>
);

const Sidebar = ({ collapsed, handleCollapse, navigations, reset }) => {
  const { modal } = App.useApp();
  const [width] = useWindowSize();
  const location = useLocation();
  const pathname = location.pathname;

  // Logout menu item — shows a confirmation dialog before resetting auth state
  const bottomItems = [
    getItem(
      <motion.div whileHover={{ x: 6 }}>
        <Link
          href="javascript:void(0)"
          onClick={() => {
            modal.confirm({
              title: "Sign Out",
              content: "Are you sure you want to sign out?",
              okText: "Sign Out",
              cancelText: "Cancel",
              okButtonProps: { danger: true },
              onOk: reset,
            });
          }}
        >
          Sign Out
        </Link>
      </motion.div>,
      "signout",
      <LoginOutlined />,
    ),
  ];

  return (
    <div className={width <= 992 ? "" : "h-screen"}>
      {/* Mobile / tablet: slide-in Drawer */}
      {width <= 992 ? (
        <Drawer
          placement="left"
          onClose={() => handleCollapse(false)}
          open={collapsed}
          className="h-full"
          styles={{
            body: { padding: 0, display: "flex", flexDirection: "column" },
          }}
        >
          <Brand collapsed={false} />
          <TopMenus
            path={pathname}
            navigations={navigations}
            handleCollapse={() => handleCollapse(false)}
          />
          <Divider className="my-0" />
          <Menu
            mode="inline"
            items={bottomItems}
            selectedKeys={[]}
            onClick={() => handleCollapse(false)}
          />
        </Drawer>
      ) : (
        /* Desktop: persistent collapsible Sider */
        <Sider
          className="hidden h-screen overflow-hidden md:flex flex-1 flex-col shadow"
          breakpoint="lg"
          collapsible
          collapsed={collapsed}
          theme="light"
          onCollapse={(value) => handleCollapse(value)}
          width={220}
        >
          <div className="flex flex-col h-full">
            <Brand collapsed={collapsed} />
            <div className="flex-1 overflow-y-auto">
              <TopMenus path={pathname} navigations={navigations} />
            </div>
            <div className="mt-auto border-t border-gray-800">
              <Menu mode="inline" items={bottomItems} selectedKeys={[]} />
            </div>
          </div>
        </Sider>
      )}
    </div>
  );
};

export default Sidebar;
