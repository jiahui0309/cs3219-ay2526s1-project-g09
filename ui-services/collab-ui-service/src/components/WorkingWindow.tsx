import React, { useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";
import CollabEditor from "./collab/CollabEditor";

const WorkingWindow: React.FC = () => {
  const { sessionId, questionId, users } = useMemo(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const derivedUsers = searchParams.getAll("user");

    return {
      sessionId: searchParams.get("sessionId") ?? undefined,
      questionId: searchParams.get("questionId") ?? undefined,
      users: derivedUsers.length > 0 ? derivedUsers : [],
    };
  }, []);

  return (
    <div className="flex flex-1 bg-gray-800 rounded-lg shadow-md overflow-hidden relative">
      <Tabs defaultValue="code" className="flex flex-col flex-1">
        <TabsList className="absolute top-4 right-4 z-10 bg-gray-700 rounded-lg shadow-md">
          <TabsTrigger
            value="code"
            className="data-[state=active]:bg-orange-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            Code
          </TabsTrigger>
          <TabsTrigger
            value="whiteboard"
            className="data-[state=active]:bg-orange-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            Whiteboard
          </TabsTrigger>
        </TabsList>
        <TabsContent value="code" className="flex-1 p-4 overflow-hidden">
          <CollabEditor
            questionId={questionId}
            users={users}
            sessionId={sessionId}
          />
        </TabsContent>
        <TabsContent value="whiteboard" className="flex-1 p-4 overflow-hidden">
          <Tldraw />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkingWindow;
