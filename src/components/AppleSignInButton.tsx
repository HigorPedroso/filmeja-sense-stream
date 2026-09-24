import { Loader2 } from "lucide-react";

// Sign in with Apple button per Apple's Human Interface Guidelines
// (https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple):
// Apple logo (not a generic apple icon) left of the label, label set in the
// system font, white style on dark backgrounds (black text/logo), title-case
// "Continue with Apple", height >= 44pt. App Review rejected the previous
// button (Guideline 4) for using a logo not taken from Apple Design Resources.
// If they still object, drop the official logo file from
// https://developer.apple.com/design/resources/ into /public and swap the
// <svg> below for an <img>.
const APPLE_LOGO_PATH =
  "M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701";

interface AppleSignInButtonProps {
  label: string;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function AppleSignInButton({
  label,
  onClick,
  loading = false,
  disabled = false,
  className = "",
}: AppleSignInButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white text-black transition-colors hover:bg-gray-100 active:bg-gray-200 disabled:pointer-events-none disabled:opacity-50 ${className}`}
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
        fontSize: 19,
        fontWeight: 500,
        letterSpacing: "-0.02em",
      }}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <svg
          viewBox="0 0 24 24"
          width={22}
          height={22}
          fill="currentColor"
          aria-hidden="true"
          style={{ marginTop: -2 }}
        >
          <path d={APPLE_LOGO_PATH} />
        </svg>
      )}
      <span>{label}</span>
    </button>
  );
}
