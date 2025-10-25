import React from "react";
import Layout from "@components/layout/BlueBgLayout";
import NavHeader from "@components/common/NavHeader";
import { RemoteWrapper } from "@/components/mfe/RemoteWrapper";
import { useAuth } from "@/data/UserStore";

const HistoryPage: React.FC = () => {
  const { user } = useAuth();

  const remoteProps = React.useMemo(
    () => ({
      userId: user?.username,
      allowUserFilter: false,
    }),
    [user?.username],
  );

  return (
    <Layout navHeader={<NavHeader />}>
      <RemoteWrapper
        remote={() => import("historyUiService/HistoryApp")}
        remoteName="History UI Service"
        loadingMessage="Loading History..."
        errorMessage="History service unavailable"
        remoteProps={remoteProps}
      />
    </Layout>
  );
};

export default HistoryPage;
