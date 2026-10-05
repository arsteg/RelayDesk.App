import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { apiFetch } from "@/api/client";
import { openOrderStream, type StreamStatus } from "@/api/realtime";
import { useAuth } from "@/state/auth";
import { Banner, Card, StatusBadge } from "@/components/ui";
import { formatMoney, formatQuantity } from "@/money";
import { colors } from "@/theme";
import type { OrderDetail } from "@relaydesk/shared";

export default function OrderDetailScreen() {
  const { id, placed } = useLocalSearchParams<{ id: string; placed?: string }>();
  const { session } = useAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [live, setLive] = useState<StreamStatus>("reconnecting");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    if (!session || !id) return;
    try {
      setOrder(await apiFetch<OrderDetail>(`/customer/orders/${id}`, { token: session.token }));
    } catch {
      /* keep last known state */
    }
  }, [session, id]);

  useEffect(() => {
    if (!session || !id) return;
    load();
    // Live status over WebSocket; poll as a fallback if it keeps dropping.
    const stop = openOrderStream({
      path: "/customer/realtime/ws",
      token: session.token,
      onEvent: (e) => {
        const o = e.order as { id?: string } | undefined;
        if (o?.id === id) load();
      },
      onStatus: (s) => {
        setLive(s);
        if (s === "fallback" && !pollRef.current) pollRef.current = setInterval(load, 5000);
        if (s === "connected" && pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      },
    });
    return () => {
      stop();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [session, id, load]);

  if (!session) return null;
  const currency = session.business.currency;

  const liveLabel = live === "connected" ? "● Live" : live === "fallback" ? "Updating…" : "Connecting…";
  const liveColor = live === "connected" ? colors.green : live === "fallback" ? colors.amber : colors.muted;

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      {placed === "1" && <Banner tone="green">Order placed! The business can now see it and will start preparing.</Banner>}
      {!order ? (
        <Text style={{ color: colors.muted }}>Loading…</Text>
      ) : (
        <>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Text style={{ fontSize: 20, fontWeight: "700", color: colors.text }}>Order #{order.number}</Text>
            <Text style={{ color: liveColor, fontWeight: "600" }}>{liveLabel}</Text>
          </View>

          <Card style={{ marginBottom: 14 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
              <Text style={{ fontWeight: "600", color: colors.text }}>Status</Text>
              <StatusBadge status={order.status} />
            </View>
            {order.statusHistory.map((h) => (
              <View key={h.id} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <StatusBadge status={h.toStatus} />
                <Text style={{ color: colors.muted }}>{new Date(h.createdAt).toLocaleString()}</Text>
              </View>
            ))}
          </Card>

          <Card style={{ marginBottom: 14 }}>
            <Text style={{ fontWeight: "600", color: colors.text, marginBottom: 8 }}>Items</Text>
            {order.items.map((i) => (
              <View key={i.id} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 }}>
                <Text style={{ color: colors.text, flex: 1 }}>
                  {formatQuantity(i.quantityMilli)} × {i.description}
                </Text>
                <Text style={{ color: colors.text }}>{formatMoney(i.lineTotalMinor, currency)}</Text>
              </View>
            ))}
            <View style={{ borderTopWidth: 1, borderTopColor: colors.border, marginTop: 8, paddingTop: 8 }}>
              <Row label="Subtotal" value={formatMoney(order.subtotalMinor, currency)} />
              {order.taxMinor > 0 && <Row label="Tax" value={formatMoney(order.taxMinor, currency)} />}
              {order.deliveryChargeMinor > 0 && <Row label="Delivery" value={formatMoney(order.deliveryChargeMinor, currency)} />}
              <Row label="Total" value={formatMoney(order.totalMinor, currency)} strong />
            </View>
          </Card>

          <Card>
            <Row label="Fulfilment" value={order.fulfillmentType === "DELIVERY" ? "Delivery" : "Pickup"} />
            <Row label="When" value={order.fulfillmentAt ? new Date(order.fulfillmentAt).toLocaleString() : "—"} />
            {order.deliveryAddress ? <Row label="Address" value={order.deliveryAddress} /> : null}
            {order.notes ? <Row label="Notes" value={order.notes} /> : null}
          </Card>
        </>
      )}
    </ScrollView>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 }}>
      <Text style={{ color: colors.muted }}>{label}</Text>
      <Text style={{ color: colors.text, fontWeight: strong ? "700" : "400", flexShrink: 1, textAlign: "right", marginLeft: 12 }}>{value}</Text>
    </View>
  );
}
