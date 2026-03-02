import { LoginOutlined } from "@ant-design/icons";
import { App, Divider, Drawer, Image, Layout, Menu } from "antd";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router";
import { logo } from "../../assets/images/logos";
import { useWindowSize } from "../../hooks/useWindowSize";
import { generateItems, getItem } from "../../utils/itemFormat";

const { Sider } = Layout;
const TopMenus = ({ path, navigations = [], handleCollapse = () => {} }) => (
  <Menu
    className=" flex-1"
    mode="inline"
    items={generateItems(navigations)}
    defaultSelectedKeys={path}
    onClick={handleCollapse}
  />
);

const Sidebar = ({
  collapsed,
  handleCollapse,
  navigations,
  reset,
  userData,
}) => {
  const { modal } = App.useApp();
  const [width] = useWindowSize();
  const location = useLocation();

  const pathname = location.pathname;
  // const pathname = location.pathname.replace("/", "");

  const bottomItems = [
    getItem(
      <motion.div
        variants={{
          offscreen: { y: -200, opacity: 0 },
          onscreen: {
            y: 0,
            opacity: 1,
            transition: { type: "spring", bounce: 0.2, duration: 1 },
          },
        }}
        whileHover={{
          x: 10,
          shadow: 20,
        }}
      >
        <Link
          href="javascript:void(0)"
          onClick={() => {
            modal.confirm({
              title: "LOGOUT",
              content: "Do you want to logout?",
              okText: "YES",
              cancelText: "NO",
              okButtonProps: {
                style: { backgroundColor: "red" },
              },
              onOk: reset,
            });
          }}
        >
          Logout
        </Link>
      </motion.div>,
      "signout",
      <LoginOutlined className="h-6 w-6" />
    ),
  ];

  return (
    <div className={width <= 992 ? "" : `h-screen`}>
      {width <= 992 ? (
        <Drawer
          placement="left"
          onClose={() => handleCollapse(false)}
          open={collapsed}
          className=" h-full"
        >
          <motion.div
            variants={{
              transition: {
                staggerChildren: 0.5,
              },
            }}
            initial={"offscreen"}
            whileInView={"onscreen"}
            viewport={{ amount: 0.1 }}
            transition={{ staggerChildren: 0.04 }}
            className="  flex flex-col h-full"
          >
            <center>
              <div className="logo">
                <Image
                  preview={false}
                  src={logo}
                  className="  p-4"
                  style={{ maxWidth: "200px" }}
                />
              </div>
              <div className="logo p-3 flex flex-col">
                <label className=" text-2xl capitalize">
                  {userData &&
                    [userData.firstName, userData.lastName].join(" ")}
                </label>
                <label className="text-sm">
                  {userData && userData.accountId}
                </label>
              </div>
            </center>
            <TopMenus
              path={pathname}
              navigations={navigations}
              handleCollapse={() => handleCollapse(false)}
            />
            <Menu
              mode="inline"
              items={bottomItems}
              defaultSelectedKeys={pathname}
              onClick={() => handleCollapse(false)}
            />
          </motion.div>
        </Drawer>
      ) : (
        <Sider
          className=" hidden h-screen overflow-hidden md:flex flex-col shadow"
          breakpoint="lg"
          collapsible
          collapsed={collapsed}
          theme="light"
          onCollapse={(value) => handleCollapse(value)}
          width={250}
        >
          <center className=" p-2">
            <div className="logo ">
              <Image
                preview={false}
                src={logo}
                className="  p-4"
                style={{ maxWidth: "150px" }}
              />
            </div>
          </center>
          <TopMenus path={pathname} navigations={navigations} />
        </Sider>
      )}
    </div>
  );
};
export default Sidebar;
