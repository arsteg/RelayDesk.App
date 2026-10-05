import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ApiError, apiFetch } from "@/api/client";
import { useAuth } from "@/state/auth";
import { Banner, Button, Field, Input } from "@/components/ui";
import { colors } from "@/theme";
import type { InvitationPublic } from "@relaydesk/shared";

/**
 * Onboarding via an invitation token. Reach it with a deep link:
 *   relaydeskorder://accept?token=<token>
 * or paste the token manually.
 */
export default function AcceptScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const { accept } = useAuth();
  const [token, setToken] = useState(params.token ?? "");
  const [invite, setInvite] = useState<InvitationPublic | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
    apiFetch<InvitationPublic>(`/invitations/${token}`)
      .then((inv) => {
        setInvite(inv);
        setName(inv.name ?? "");
        setError(null);
      })
      .catch(() => setInvite(null));
  }, [token]);

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      await accept(token.trim(), { name: name.trim(), password, phone: phone || null });
      router.replace("/menu");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not complete onboarding.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: "700", color: colors.text, marginBottom: 4 }}>
        {invite ? `Join ${invite.businessName}` : "Accept invitation"}
      </Text>
      <Text style={{ color: colors.muted, marginBottom: 20 }}>
        {invite ? `Set up your account for ${invite.email}.` : "Enter your invitation token to begin."}
      </Text>
      {error && <Banner tone="red">{error}</Banner>}
      {!params.token && (
        <Field label="Invitation token">
          <Input value={token} onChangeText={setToken} autoCapitalize="none" placeholder="Paste from your invite link" />
        </Field>
      )}
      <Field label="Your name">
        <Input value={name} onChangeText={setName} placeholder="Full name" />
      </Field>
      <Field label="Phone (optional)">
        <Input value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="Phone number" />
      </Field>
      <Field label="Choose a password">
        <Input value={password} onChangeText={setPassword} secureTextEntry placeholder="At least 10 characters" />
      </Field>
      <View style={{ marginTop: 8 }}>
        <Button title="Create account" onPress={submit} loading={busy} disabled={!token || !name || password.length < 10} />
      </View>
    </ScrollView>
  );
}
