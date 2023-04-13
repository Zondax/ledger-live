import React from "react";
const Lock = ({ size, color = "currentColor" }: { size: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 16 18">
    <path
      fill={color}
      d="M13.8438 7H12.7812V5.47266C12.7812 2.81641 10.6562 0.658203 8 0.625C5.34375 0.625 3.21875 2.7832 3.21875 5.40625V7H2.15625C1.25977 7 0.5625 7.73047 0.5625 8.59375V16.0312C0.5625 16.9277 1.25977 17.625 2.15625 17.625H13.8438C14.707 17.625 15.4375 16.9277 15.4375 16.0312V8.59375C15.4375 7.73047 14.707 7 13.8438 7ZM4.8125 5.40625C4.8125 3.67969 6.24023 2.21875 8 2.21875C9.72656 2.21875 11.1875 3.67969 11.1875 5.40625V7H4.8125V5.40625ZM13.8438 16.0312H2.15625V8.59375H13.8438V16.0312Z"
    />
  </svg>
);
export default Lock;
