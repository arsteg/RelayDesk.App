import { useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { ApiError, apiFetch } from "@/api/client";
import { useAuth } from "@/state/auth";
import { useCart } from "@/state/cart";
import { Banner, Button, Card, Field, Input } from "@/components/ui";
import { formatMoney } from "@/money";
import { colors } from "@/theme";
import type { OrderDetail, PlaceOrderRequest } from "@relaydesk/shared";

function defaultWhenIso(): string {
  const d = new Date(Date.now() + 86400_000);
  d.setHours(10, 0, 0, 0);
  return d.toISOString();
}

export default function CartScreen() {
  const { session } = useAuth();
  const cart = useCart();
  const [type, setType] = useState<"PICKUP" | "DELIVERY">("PICKUP");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!session) return null;
  const currency = session.business.currency;

  const place = async () => {
    setError(null);
    setBusy(true);
    try {
      const body: PlaceOrderRequest = {
        items: cart.lines.map((l) => ({ productId: l.productId, quantity: String(l.quantity), unit: l.orderUnit })),
        fulfillmentType: type,
        fulfillmentAt: defaultWhenIso(),
        deliveryAddress: type === "DELIVERY" ? address : null,
        notes: notes || null,
      };
      const order = await apiFetch<OrderDetail>("/customer/orders", { token: session.token, body });
      cart.clear();
      router.replace({ pathname: "/orders/[id]", params: { id: order.id, placed: "1" } });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not place the order.");
    } finally {
      setBusy(false);
    }
  };

  if (cart.lines.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Text style={{ color: colors.muted, marginBottom: 16 }}>Your cart is empty.</Text>
        <Button title="Browse menu" onPress={() => router.replace("/menu")} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      {error && <Banner tone="red">{error}</Banner>}
      <Card style={{ marginBottom: 14 }}>
        {cart.lines.map((l) => (
          <View key={l.productId} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 }}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={{ fontWeight: "600", color: colors.text }}>{l.name}</Text>
              <Text style={{ color: colors.muted }}>{formatMoney(l.priceMinor, currency)} / {l.unit}</Text>
              {l.isVariableMeasure ? <Text style={{ color: colors.muted, fontSize: 12 }}>Estimate — billed on measured weight.</Text> : null}
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Pressable onPress={() => cart.setQuantity(l.productId, Math.max(0, Math.round((l.quantity - 1) * 1000) / 1000))} hitSlop={10}>
                <Text style={{ fontSize: 20, color: colors.brand }}>−</Text>
              </Pressable>
              <Input
                value={String(l.quantity)}
                onChangeText={(t) => {
                  const n = parseFloat(t);
                  if (Number.isFinite(n) && n > 0) cart.setQuantity(l.productId, n);
                }}
                keyboardType="decimal-pad"
                style={{ width: 60, textAlign: "center" }}
                aria-label={`Quantity for ${l.name}`}
              />
              <Pressable onPress={() => cart.setQuantity(l.productId, Math.round((l.quantity + 1) * 1000) / 1000)} hitSlop={10}>
                <Text style={{ fontSize: 20, color: colors.brand }}>+</Text>
              </Pressable>
              <Text style={{ color: colors.muted, minWidth: 28 }}>{l.orderUnit}</Text>
            </View>
          </View>
        ))}
        <View style={{ flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: colors.border, marginTop: 8, paddingTop: 10 }}>
          <Text style={{ color: colors.muted }}>Subtotal (before tax)</Text>
          <Text style={{ fontWeight: "700" }}>{formatMoney(cart.subtotalMinor, currency)}</Text>
        </View>
        <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
          Taxes and delivery are calculated by the business when confirmed.
        </Text>
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <Field label="Fulfilment">
          <View style={{ flexDirection: "row", gap: 8 }}>
            {(["PICKUP", "DELIVERY"] as const).map((t) => (
              <Pressable
                key={t}
                onPress={() => setType(t)}
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: type === t ? colors.brand : colors.border,
                  backgroundColor: type === t ? colors.brandDark : "#fff",
                  borderRadius: 10,
                  paddingVertical: 10,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: type === t ? "#fff" : colors.text, fontWeight: "600" }}>{t === "PICKUP" ? "Pickup" : "Delivery"}</Text>
              </Pressable>
            ))}
          </View>
        </Field>
        {type === "DELIVERY" && (
          <Field label="Delivery address">
            <Input value={address} onChangeText={setAddress} multiline placeholder="Street, city" style={{ minHeight: 60 }} />
          </Field>
        )}
        <Field label="Notes (optional)">
          <Input value={notes} onChangeText={setNotes} multiline placeholder="Anything we should know?" style={{ minHeight: 48 }} />
        </Field>
        <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 10 }}>
          Fulfilment time defaults to tomorrow 10:00{Platform.OS === "web" ? "" : ""}. The business will confirm details.
        </Text>
        <Button title="Place order" onPress={place} loading={busy} disabled={type === "DELIVERY" && !address.trim()} />
      </Card>
    </ScrollView>
  );
}
