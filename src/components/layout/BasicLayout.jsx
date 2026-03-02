import {
  DownOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UpOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Card,
  Divider,
  Layout,
  Popover,
  Typography,
} from "antd";
import { motion } from "framer-motion";
import { useState } from "react";
import { Outlet } from "react-router";
import { useWindowSize } from "../../hooks/useWindowSize";
import Sidebar from "./Sidebar";

const { Header, Content } = Layout;
const BasicLayout = ({ navigations = [], store }) => {
  const { userData, reset } = store();
  const [collapsed, setCollapsed] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [width] = useWindowSize();

  const handleCollapse = (value) => {
    setCollapsed(value);
  };

  const handleOpenChange = (newOpen) => {
    setUserOpen(newOpen);
  };
  return (
    <Layout className=" h-screen w-screen  fixed">
      <Sidebar
        handleCollapse={handleCollapse}
        collapsed={collapsed}
        navigations={navigations}
        reset={reset}
        userData={null}
      />
      <Layout className="site-layout">
        <Header
          style={{ backgroundColor: "#1E3A71", padding: "0 16px" }}
          className="site-layout-background flex justify-between items-center h-[55px] bg-primaryColor text-white px-3 md:pr-7"
        >
          <div className="flex h-full items-center gap-3 text-white">
            {collapsed ? (
              <MenuFoldOutlined
                className=" text-2xl"
                onClick={() => handleCollapse(!collapsed)}
              />
            ) : (
              <MenuUnfoldOutlined
                className=" text-2xl"
                onClick={() => handleCollapse(!collapsed)}
              />
            )}
          </div>

          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{
              y: 0,
              opacity: 1,
              transition: { duration: 0.5 },
            }}
            whileTap={{
              scale: 0.8,
            }}
          >
            {width <= 480 ? (
              <></>
            ) : (
              <Popover
                content={
                  <Card>
                    <div className=" text-center ">
                      <Avatar
                        size={60}
                        icon={<UserOutlined />}
                        className=" bg-primaryColor"
                      />
                      <div className=" leading-none">
                        <Typography.Title level={4}>
                          {userData &&
                            [userData.firstName, userData.lastName]
                              .join(" ")
                              ?.trim()}
                        </Typography.Title>
                      </div>
                      <div>
                        <Typography.Text>
                          {userData && userData.username}
                        </Typography.Text>
                      </div>
                      <Divider />
                      <Button danger onClick={reset} icon={<LogoutOutlined />}>
                        SIGN OUT
                      </Button>
                    </div>
                  </Card>
                }
                trigger="click"
                onOpenChange={handleOpenChange}
                open={userOpen}
                className=" cursor-pointer"
              >
                <div className=" flex justify-center items-center ">
                  <div className="justify-start items-center gap-3 flex">
                    <Avatar size={40} icon={<UserOutlined />} />
                    {/* <div className="justify-start items-start gap-2 flex">
                      <div className="text-white text-base font-normal  leading-normal">
                        {userData &&
                          [userData.firstName, userData.lastName].join(" ")}
                      </div>
                    </div> */}
                  </div>
                </div>
              </Popover>
            )}
          </motion.div>
        </Header>
        <Content className=" bg-white h-full w-full overflow-auto ">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default BasicLayout;
