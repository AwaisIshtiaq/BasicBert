/** BasicBERT wordmark glyph — encoder block stacked into a "B". */
export function Logo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="1" y="1" width="30" height="30" rx="9" className="fill-accent" />
      <path
        d="M10 8.5h6.6c2.6 0 4.4 1.4 4.4 3.6 0 1.5-.8 2.6-2.1 3.1 1.7.4 2.8 1.7 2.8 3.6 0 2.5-2 4.1-5.1 4.1H10V8.5Zm3 2.6v3.4h3.1c1.2 0 1.9-.6 1.9-1.7s-.7-1.7-1.9-1.7H13Zm0 5.7v3.9h3.4c1.3 0 2.1-.7 2.1-1.9s-.8-2-2.2-2H13Z"
        className="fill-background"
      />
      <rect
        x="21.5"
        y="8.5"
        width="3"
        height="3"
        rx="1"
        className="fill-background/70"
      />
      <rect
        x="21.5"
        y="20.5"
        width="3"
        height="3"
        rx="1"
        className="fill-background/70"
      />
    </svg>
  );
}
