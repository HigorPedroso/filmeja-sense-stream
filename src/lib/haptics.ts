import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Capacitor } from "@capacitor/core";

// Fire-and-forget: haptics are a nice-to-have, never worth surfacing an
// error for, and a no-op on web (no vibration motor).
export function lightImpact() {
  if (!Capacitor.isNativePlatform()) return;
  Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
}
