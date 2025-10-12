import { useState, useEffect } from "react";
import type {
  MatchingResponse,
  UserPreferences,
  MatchResult,
  TimeoutConfig,
} from "@/api/matchingService";
import {
  cancelMatch,
  connectMatch,
  acceptMatch,
  rejectMatch,
  requestMatch,
  getTimeoutConfig,
} from "@/api/matchingService";

type PageView = "initial" | "preferences" | "matching" | "matchFound";

interface UseMatchingProps {
  username: string;
  onNavigate?: (path: string) => void;
}

export function useMatching({ username, onNavigate }: UseMatchingProps) {
  const [currentView, setCurrentView] = useState<PageView>("initial");
  const [matchData, setMatchData] = useState<MatchingResponse | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isWaitingForAcceptance, setIsWaitingForAcceptance] = useState(false);
  const [showRejectedDialog, setShowRejectedDialog] = useState(false);
  const [matchRequestPromise, setMatchRequestPromise] =
    useState<Promise<MatchResult> | null>(null);
  const [timeoutConfig, setTimeoutConfig] = useState<TimeoutConfig>({
    matchRequestTimeout: 30000,
    matchAcceptanceTimeout: 30000,
  });

  // Fetch timeout config on mount
  useEffect(() => {
    const fetchConfig = async () => {
      const config = await getTimeoutConfig();
      setTimeoutConfig(config);
    };
    fetchConfig();
  }, []);

  const handleStartMatching = (): void => {
    setCurrentView("preferences");
  };

  const handleConfirmPreferences = (prefs: UserPreferences): void => {
    setPreferences(prefs);

    // Start the match request immediately
    const matchPromise = requestMatch(prefs);
    setMatchRequestPromise(matchPromise);

    // Move to matching view to show UI
    setCurrentView("matching");
  };

  const handleMatchFound = async (data: MatchingResponse): Promise<void> => {
    setMatchData(data);
    setCurrentView("matchFound");

    try {
      // Connect and wait for acceptance response (backend holds connection)
      const response = await connectMatch(username, data.matchId);

      if (response.status.toUpperCase() === "SUCCESS") {
        // Both users accepted - navigate to collab
        if (onNavigate) {
          onNavigate("/collab");
        }
      } else if (response.status.toUpperCase() === "REJECTED") {
        setShowRejectedDialog(true);
      }
    } catch (err) {
      console.error("Failed to connect to match", err);
    }
  };

  const handleAcceptMatch = async (): Promise<void> => {
    if (!matchData) return;

    try {
      // Just accept the match - connectMatch() is already waiting for response
      await acceptMatch(username, matchData.matchId);
      setIsWaitingForAcceptance(true);
    } catch (err) {
      console.error("Failed to accept match", err);
    }
  };

  const handleRejectMatch = async (): Promise<void> => {
    if (!matchData) return;

    try {
      await rejectMatch(username, matchData.matchId);
    } catch (err) {
      console.error("Failed to reject match", err);
    } finally {
      handleCancel();
    }
  };

  const handleCancel = async (): Promise<void> => {
    if (preferences) {
      await cancelMatch(username);
    }
    resetState();
  };

  const handleMatchError = (): void => {
    setMatchRequestPromise(null);
    setCurrentView("initial");
  };

  const handleMatchNotFound = (): void => {
    setMatchRequestPromise(null);
    setCurrentView("initial");
  };

  const handleDismissRejected = (): void => {
    setShowRejectedDialog(false);
    resetState();
  };

  const resetState = () => {
    setIsWaitingForAcceptance(false);
    setShowRejectedDialog(false);
    setMatchData(null);
    setMatchRequestPromise(null);
    setCurrentView("initial");
  };

  return {
    // State
    currentView,
    matchData,
    preferences,
    isWaitingForAcceptance,
    showRejectedDialog,
    matchRequestPromise,
    timeoutConfig,

    // Handlers
    handleStartMatching,
    handleConfirmPreferences,
    handleMatchFound,
    handleAcceptMatch,
    handleRejectMatch,
    handleCancel,
    handleMatchError,
    handleMatchNotFound,
    handleDismissRejected,
  };
}
