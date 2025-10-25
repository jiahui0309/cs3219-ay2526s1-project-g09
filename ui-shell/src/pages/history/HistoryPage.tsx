import React from "react";
import Layout from "@components/layout/BlueBgLayout";
import NavHeader from "@components/common/NavHeader";
import { useAuth } from "@/data/UserStore";
import { useNavigate } from "react-router-dom";
import { RemoteWrapper } from "@/components/mfe/RemoteWrapper";
import { normaliseHistorySnapshot } from "@/api/historyService";

const HistoryPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const remoteProps = React.useMemo(
    () => ({
      userId: user?.username,
      allowUserFilter: true,
      renderQuestionPanel: false,
      onEntrySelect: (entry: unknown) => {
        const snapshot = normaliseHistorySnapshot(entry as any);
        if (snapshot) {
          navigate(`/history/${snapshot.id}`, { state: { entry: snapshot } });
        }
      },
    }),
    [user?.username, navigate],
  );

  return (
    <Layout navHeader={<NavHeader />}>
      <RemoteWrapper
        remote={() => import("historyUiService/HistoryApp")}
        remoteName="History UI Service"
        loadingMessage="Loading history..."
        errorMessage="History service unavailable"
        remoteProps={remoteProps}
      />
    </Layout>
  );
};

export default HistoryPage;
