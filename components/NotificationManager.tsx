"use client";

import { useEffect } from "react";

export default function NotificationManager() {
  useEffect(() => {
    if ("Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            console.log("Notification permission granted.");
          }
        });
      }
    }
  }, []);

  return null;
}
