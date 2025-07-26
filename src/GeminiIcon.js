// components/GeminiIcon.js
export default function GeminiIcon({ size = 24 }) {
  return (
    <svg 
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 2L4 7v10l8 5 8-5V7L12 2zm0 2.5L18 7l-6 3.5L6 7l6-3.5zm0 6.5L6 8v8l6 3.5 6-3.5V8l-6 3.5z"/>
    </svg>
  );
}