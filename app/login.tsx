import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { ApiError } from "@/api/client";
import { useAuth } from "@/state/auth";
import { Banner, Button, Field, Input } from "@/components/ui";
import { colors } from "@/theme";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      await login(email.trim(), password, businessId.trim());
      router.replace("/menu");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: "700", color: colors.text, marginBottom: 4 }}>Welcome back</Text>
      <Text style={{ color: colors.muted, marginBottom: 20 }}>Sign in to place and track your orders.</Text>
      {error && <Banner tone="red">{error}</Banner>}
      <Banner tone="blue">Invited? Open the invitation link to set up your account.</Banner>
      <Field label="Email">
        <Input value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" />
      </Field>
      <Field label="Password">
        <Input value={password} onChangeText={setPassword} secureTextEntry placeholder="Your password" />
      </Field>
      <Field label="Store id">
        <Input value={businessId} onChangeText={setBusinessId} autoCapitalize="none" placeholder="Shown on your invitation" />
      </Field>
      <View style={{ marginTop: 8 }}>
        <Button title="Sign in" onPress={submit} loading={busy} disabled={!email || !password || !businessId} />
      </View>
    </ScrollView>
  );
}
