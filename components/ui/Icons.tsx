import type { SVGProps } from "react";

export type IconName =
  | "home"
  | "users"
  | "user"
  | "book"
  | "clipboard"
  | "check-circle"
  | "pencil"
  | "currency"
  | "key"
  | "bell"
  | "chart"
  | "cog"
  | "calendar"
  | "refresh"
  | "logout"
  | "shield"
  | "eye"
  | "eye-off"
  | "mail"
  | "lock"
  | "arrow-left"
  | "spark"
  | "alert"
  | "info"
  | "download";

const PATHS: Record<IconName, React.ReactNode> = {
  home: (
    <path d="M3 10.5 12 3l9 7.5M5 9.5V21h5v-6h4v6h5V9.5" />
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.25" />
      <path d="M2.75 19.5c0-3 2.8-5 6.25-5s6.25 2 6.25 5M16 4.9a3.25 3.25 0 0 1 0 6.2M17.6 14.7c2.1.6 3.65 2.1 3.65 4.8" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.5 3.1-5.5 7-5.5s7 2 7 5.5" />
    </>
  ),
  book: (
    <path d="M12 6.5C10.5 5 8.4 4.5 4 4.5v14c4.4 0 6.5.5 8 2 1.5-1.5 3.6-2 8-2v-14c-4.4 0-6.5.5-8 2Zm0 0V20" />
  ),
  clipboard: (
    <>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4.5V3h6v1.5M9 10h6M9 14h6M9 18h3" />
    </>
  ),
  "check-circle": (
    <>
      <circle cx="12" cy="12" r="8.75" />
      <path d="m8.5 12.2 2.4 2.4 4.6-5" />
    </>
  ),
  pencil: (
    <path d="m14.5 5 4.5 4.5L8.5 20H4v-4.5L14.5 5Zm2.4-1.6 1.2-1.2a1.6 1.6 0 0 1 2.3 0l1 1a1.6 1.6 0 0 1 0 2.3l-1.3 1.2" />
  ),
  currency: (
    <>
      <circle cx="12" cy="12" r="8.75" />
      <path d="M12 6.8v10.4M15 9.2c-.6-1-1.7-1.5-3-1.5-1.7 0-3 .9-3 2.3 0 2.9 6 1.6 6 4.4 0 1.4-1.3 2.3-3 2.3-1.4 0-2.6-.6-3.1-1.7" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15.5" r="4.25" />
      <path d="m11.2 12.3 8-8M16.5 7l2.8 2.8M13.8 9.7l2.4 2.4" />
    </>
  ),
  bell: (
    <path d="M12 3.5c-3.3 0-5.5 2.4-5.5 5.5 0 4.4-1.7 5.6-2.5 6.5h16c-.8-.9-2.5-2.1-2.5-6.5 0-3.1-2.2-5.5-5.5-5.5Zm-3 15a3 3 0 0 0 6 0" />
  ),
  chart: (
    <path d="M4 4v16h16M8.5 16v-5M13 16V7.5M17.5 16v-3" />
  ),
  cog: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5 13 6a6.4 6.4 0 0 1 2.3 1l2.6-.8 1.4 2.5-1.9 2a6.6 6.6 0 0 1 0 2.6l1.9 2-1.4 2.5-2.6-.8a6.4 6.4 0 0 1-2.3 1L12 20.5 11 18a6.4 6.4 0 0 1-2.3-1l-2.6.8-1.4-2.5 1.9-2a6.6 6.6 0 0 1 0-2.6l-1.9-2 1.4-2.5 2.6.8a6.4 6.4 0 0 1 2.3-1L12 3.5Z" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5.5" width="16" height="15" rx="2" />
      <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4M8.5 14h2M13.5 14h2M8.5 17h2" />
    </>
  ),
  refresh: (
    <path d="M4.5 12a7.5 7.5 0 0 1 13-5.2l2 2M19.5 12a7.5 7.5 0 0 1-13 5.2l-2-2M19.5 4v4.8h-4.8M4.5 20v-4.8h4.8" />
  ),
  logout: (
    <path d="M14 4.5H7A2.5 2.5 0 0 0 4.5 7v10A2.5 2.5 0 0 0 7 19.5h7M16 8l4 4-4 4M20 12H9.5" />
  ),
  shield: (
    <path d="M12 3 4.5 5.8v5.4c0 4.6 3.2 8 7.5 9.8 4.3-1.8 7.5-5.2 7.5-9.8V5.8L12 3Zm-3 9 2.2 2.2 4-4.4" />
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.75 12 5.75 21.5 12 21.5 12 18 18.25 12 18.25 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  "eye-off": (
    <path d="m4 4 16 16M10 6.1a8.9 8.9 0 0 1 2-.35C18 5.75 21.5 12 21.5 12a17.4 17.4 0 0 1-2.8 3.4M14.1 14.2a3 3 0 0 1-4.3-4.3M6.6 6.9A16.9 16.9 0 0 0 2.5 12S6 18.25 12 18.25a9 9 0 0 0 3.4-.7" />
  ),
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4.5 7.5 7.5 5.5 7.5-5.5" />
    </>
  ),
  lock: (
    <>
      <rect x="5.5" y="10.5" width="13" height="10" rx="2" />
      <path d="M8.5 10.5V7.75a3.5 3.5 0 0 1 7 0v2.75M12 14.5v2.5" />
    </>
  ),
  "arrow-left": <path d="M19 12H5m0 0 6-6m-6 6 6 6" />,
  spark: (
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
  ),
  alert: (
    <path d="M12 4 2.75 20h18.5L12 4Zm0 6v4.5m0 3v.5" />
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.75" />
      <path d="M12 11v5m0-8.25v.5" />
    </>
  ),
  download: (
    <path d="M12 4v11m0 0 4.5-4.5M12 15l-4.5-4.5M4.5 19.5h15" />
  ),
};

export function Icon({
  name,
  className = "h-5 w-5",
  strokeWidth = 1.7,
  ...rest
}: {
  name: IconName;
  strokeWidth?: number;
} & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
