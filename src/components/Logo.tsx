'use client';

interface LogoProps {
  className?: string;
}

export function Logo({ className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Wing icon */}
      <svg
        width="24"
        height="14"
        viewBox="0 0 24 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="opacity-80"
      >
        <path
          d="M0 7C0 3.13401 3.13401 0 7 0H12L8 7L12 14H7C3.13401 14 0 10.866 0 7Z"
          fill="currentColor"
        />
        <path
          d="M12 0H17C20.866 0 24 3.13401 24 7C24 10.866 20.866 14 17 14H12L16 7L12 0Z"
          fill="currentColor"
        />
      </svg>
      {/* Hyde text */}
      <span className="text-lg font-medium opacity-80 tracking-tight">Hyde</span>
    </div>
  );
}

