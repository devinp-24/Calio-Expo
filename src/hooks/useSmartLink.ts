import { Linking, Platform } from "react-native";

export type AppTarget = {
  scheme: string;           // e.g. "ubereats", "doordash"
  path?: string;            // e.g. "store/xyz"
  iosStoreUrl?: string;     // App Store page
  androidStoreUrl?: string; // Play Store page or market://
  webFallback?: string;     // final fallback
};

export function useSmartLink() {
  const openAppOrStore = async (targets: AppTarget[]) => {
    // Try app schemes first
    for (const t of targets) {
      const url = `${t.scheme}://${t.path ?? ""}`;
      try {
        if (await Linking.canOpenURL(url)) {
          await Linking.openURL(url);
          return true;
        }
      } catch {}
    }
    // Store fallback (first target)
    const first = targets[0];
    const storeUrl = Platform.OS === "ios" ? first?.iosStoreUrl : first?.androidStoreUrl;
    if (storeUrl) {
      try {
        await Linking.openURL(storeUrl);
        return true;
      } catch {}
    }
    // Web fallback
    if (first?.webFallback) {
      await Linking.openURL(first.webFallback);
      return true;
    }
    return false;
  };

  return { openAppOrStore };
}
