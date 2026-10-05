import * as SecureStore from "expo-secure-store";
import type { CustomerAuthResponse } from "@relaydesk/shared";

const KEY = "relaydesk.customer.session";

export interface StoredSession {
  token: string;
  customer: CustomerAuthResponse["customer"];
  business: CustomerAuthResponse["business"];
}

export async function saveSession(data: CustomerAuthResponse): Promise<StoredSession> {
  const session: StoredSession = { token: data.token, customer: data.customer, business: data.business };
  await SecureStore.setItemAsync(KEY, JSON.stringify(session));
  return session;
}

export async function loadSession(): Promise<StoredSession | null> {
  const raw = await SecureStore.getItemAsync(KEY);
  if (!raw) return null;
  try {
    // Back-compat: sessions saved before the bakery -> business rename stored
    // the tenant under `bakery`. Read it so existing installs stay signed in.
    const parsed = JSON.parse(raw) as StoredSession & { bakery?: StoredSession["business"] };
    const business = parsed.business ?? parsed.bakery;
    if (!parsed.token || !parsed.customer || !business) return null;
    return { token: parsed.token, customer: parsed.customer, business };
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY);
}
