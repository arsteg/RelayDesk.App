import { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { ApiError, apiFetch } from "@/api/client";
import { useAuth } from "@/state/auth";
import { Banner, Card, StatusBadge } from "@/components/ui";
import { formatMoney } from "@/money";
import { colors } from "@/theme";
import type { OrderSummary, Paginated } from "@relaydesk/shared";

export default function OrdersScreen() {
  const { session } = useAuth();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!session) return;
    try {
      const page = await apiFetch<Paginated<OrderSummary>>("/customer/orders?pageSize=50", { token: session.token });
      setOrders(page.rows);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load orders.");
    }
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!session) return null;

  return (
    <FlatList
      data={orders}
      keyExtractor={(o) => o.id}
      contentContainerStyle={{ padding: 12 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
      ListHeaderComponent={error ? <Banner tone="red">{error}</Banner> : null}
      ListEmptyComponent={<Text style={{ color: colors.muted, textAlign: "center", marginTop: 40 }}>No orders yet.</Text>}
      renderItem={({ item }) => (
        <Pressable onPress={() => router.push({ pathname: "/orders/[id]", params: { id: item.id } })}>
          <Card style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View>
                <Text style={{ fontWeight: "700", color: colors.text }}>Order #{item.number}</Text>
                <Text style={{ color: colors.muted, marginTop: 2 }}>
                  {item.fulfillmentType === "DELIVERY" ? "Delivery" : "Pickup"} ·{" "}
                  {item.fulfillmentAt ? new Date(item.fulfillmentAt).toLocaleDateString() : "—"}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <StatusBadge status={item.status} />
                <Text style={{ marginTop: 6, fontWeight: "700" }}>{formatMoney(item.totalMinor, item.currency)}</Text>
              </View>
            </View>
          </Card>
        </Pressable>
      )}
    />
  );
}
