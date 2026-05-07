"use client";

import { useState } from "react";

export function CheckInButton() {
  const [isCheckedIn, setIsCheckedIn] = useState(false);

  return (
    <button
      onClick={() => setIsCheckedIn(!isCheckedIn)}
      className="bg-gradient-to-br from-primary-container to-primary text-on-primary-container font-h3 text-h3 px-16 py-4 rounded-full transform hover:scale-105 active:scale-95 transition-all duration-300"
      style={{
        boxShadow: "0 0 20px rgba(156, 122, 255, 0.3)",
      }}
    >
      {isCheckedIn ? "Check Out" : "Check In"}
    </button>
  );
}
