const isDev = process.env.VITE_MODE === "dev";
const HISTORY_SERVICE_BASE_URL = isDev
  ? process.env.HISTORY_SERVICE_URL
  : "https://d1h013fkmpx3nu.cloudfront.net/";

let hasLoggedMissingUrl = false;

async function sendHistorySnapshot(payload) {
  console.log("[history.client] Preparing to send history snapshot", {
    sessionId: payload?.sessionId,
    userId: payload?.userId,
    participants: payload?.participants,
  });
  if (!HISTORY_SERVICE_BASE_URL) {
    if (!hasLoggedMissingUrl) {
      console.warn(
        "HISTORY_SERVICE_URL is not configured. Skipping history persistence.",
      );
      hasLoggedMissingUrl = true;
    }
    return null;
  }

  console.log(
    "[history.client] Using history service base URL",
    HISTORY_SERVICE_BASE_URL,
  );
  try {
    const response = await fetch(`${HISTORY_SERVICE_BASE_URL}/history`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(
        `History service responded with ${response.status}: ${errorText}`,
      );
    }

    const json = await response.json();
    console.log(
      "[history.client] History snapshot persisted successfully",
      json,
    );
    return json;
  } catch (error) {
    console.error("[history.client] Failed to send history snapshot", error);
    return null;
  }
}

module.exports = {
  sendHistorySnapshot,
};
