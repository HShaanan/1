import React from "react";

const IsraelTimeContext = React.createContext({
  now: null,
  nowMs: null,
  timezoneId: "Asia/Jerusalem",
  lastSyncAt: null,
  error: null
});

export const useIsraelTime = () => React.useContext(IsraelTimeContext);

export default function IsraelTimeProvider({ children }) {
  const [state, setState] = React.useState({
    now: null,
    nowMs: null,
    timezoneId: "Asia/Jerusalem",
    lastSyncAt: null,
    error: null
  });

  // פונקציה לקבלת זמן ישראלי
  const getIsraeliTime = () => {
    try {
      const now = new Date();
      const israeliTimeString = now.toLocaleString("en-CA", {
        timeZone: "Asia/Jerusalem",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      });
      
      const israeliTime = new Date(israeliTimeString.replace(", ", "T"));
      const israeliMs = israeliTime.getTime();
      
      return {
        now: israeliTime,
        nowMs: israeliMs,
        timezoneId: "Asia/Jerusalem",
        lastSyncAt: new Date(),
        error: null
      };
    } catch (error) {
      const now = new Date();
      return {
        now,
        nowMs: now.getTime(),
        timezoneId: "Asia/Jerusalem",
        lastSyncAt: new Date(),
        error: error.message
      };
    }
  };

  // עדכון ראשוני
  React.useEffect(() => {
    const initialTime = getIsraeliTime();
    setState(initialTime);
  }, []);

  // עדכון כל שנייה
  React.useEffect(() => {
    const interval = setInterval(() => {
      const newTime = getIsraeliTime();
      setState(newTime);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <IsraelTimeContext.Provider value={state}>
      {children}
    </IsraelTimeContext.Provider>
  );
}