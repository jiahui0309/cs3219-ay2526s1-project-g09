import React from "react";
import SessionLayout from "@components/layout/BlueBgLayout";
import NavHeader from "@components/collab/SessionHeader";
import { CollabSessionProvider } from "collabUiService/CollabSessionContext";
import { useAuth } from "@/data/UserStore";
import { RemoteWrapper } from "@/components/mfe/RemoteWrapper";

const SessionPage: React.FC = () => {
  const { user } = useAuth();
  const currentUserId = user?.username ?? null;

  if (!user || !currentUserId) {
    return (
      <SessionLayout navHeader={<NavHeader />}>
        <div className="flex h-[85vh] items-center justify-center px-4">
          <p className="text-white/70">
            Please log in to access collaboration sessions.
          </p>
        </div>
      </SessionLayout>
    );
  }

  return (
    <CollabSessionProvider currentUserId={currentUserId}>
      <SessionLayout navHeader={<NavHeader />}>
        <div className="flex h-[85vh] gap-4 px-4">
          {/* Left Column (Question & Chat) */}
          <div className="flex flex-col w-1/3 gap-4">
            {/* Question Section */}
            <div className="flex-1 h-[50vh] overflow-y-auto">
              <RemoteWrapper
                remote={() => import("questionUiService/QuestionDisplay")}
                remoteName="QuestionDisplay"
                loadingMessage="Loading Question..."
                errorMessage="Question service unavailable"
              />
            </div>

            {/* Chat Section */}
            <div className="flex h-[30vh] flex-1">
              <RemoteWrapper
                remote={() => import("collabUiService/ChatWindow")}
                remoteName="ChatWindow"
                loadingMessage="Loading Chat..."
                errorMessage="Chat service unavailable"
              />
            </div>
            <div className="flex flex-1">
              <RemoteWrapper
                remote={() => import("collabUiService/WorkingWindow")}
                remoteName="WorkingWindow"
                loadingMessage="Loading Workspace..."
                errorMessage="Workspace service unavailable"
              />
            </div>
          </div>
        </div>
      </SessionLayout>
    </CollabSessionProvider>
  );
};

export default SessionPage;
