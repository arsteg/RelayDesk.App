import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { ApiError, apiFetch } from "@/api/client";
import { useAuth } from "@/state/auth";
import { useCart } from "@/state/cart";
import { Banner, Button, Card } from "@/components/ui";
import { formatMoney } from "@/money";
import { colors } from "@/theme";
import type { MenuItem, MenuResponse } from "@relaydesk/shared";

export default function MenuScreen() {
  const { session, logout } = useAuth();
  const cart = useCart();
  const [menu, setMenu] = useState<MenuResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  // Chosen order unit per product (defaults to the pricing unit).
  const [units, setUnits] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    if (!session) return;
    try {
      setMenu(await apiFetch<MenuResponse>("/customer/menu", { token: session.token }));
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load the menu.");
    }
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  // Redirect out if the session disappeared (e.g. after logout).
  useFocusEffect(
    useCallback(() => {
      if (!session) router.replace("/login");
    }, [session]),
  );

  if (!session) return null;
  const currency = session.business.currency;

  const renderItem = ({ item }: { item: MenuItem }) => {
    const qty = cart.lines.find((l) => l.productId === item.id)?.quantity ?? 0;
    const orderUnits = item.orderUnits?.length ? item.orderUnits : [item.unit];
    const chosen = units[item.id] ?? item.unit;
    return (
      <Card style={{ marginBottom: 10 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={{ fontWeight: "600", color: colors.text, fontSize: 15 }}>{item.name}</Text>
            {item.description ? <Text style={{ color: colors.muted, marginTop: 2 }}>{item.description}</Text> : null}
            <Text style={{ marginTop: 4, fontWeight: "600", color: colors.text }}>
              {formatMoney(item.priceMinor, currency)} <Text style={{ color: colors.muted, fontWeight: "400" }}>/ {item.unit}</Text>
            </Text>
            {item.isVariableMeasure ? (
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>Final price billed on measured weight.</Text>
            ) : null}
            {orderUnits.length > 1 ? (
              <View style={{ flexDirection: "row", gap: 6, marginTop: 6 }}>
                {orderUnits.map((u) => (
                  <Pressable
                    key={u}
                    onPress={() => setUnits((m) => ({ ...m, [item.id]: u }))}
                    style={{ borderWidth: 1, borderColor: chosen === u ? colors.brand : colors.border, backgroundColor: chosen === u ? colors.brandDark : "#fff", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}
                  >
                    <Text style={{ color: chosen === u ? "#fff" : colors.text, fontSize: 12, fontWeight: "600" }}>{u}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            {qty > 0 ? <Text style={{ color: colors.green, marginBottom: 4 }}>{qty} in cart</Text> : null}
            <Button
              title="Add"
              variant="secondary"
              onPress={() => cart.add({ productId: item.id, name: item.name, priceMinor: item.priceMinor, unit: item.unit, orderUnit: chosen, isVariableMeasure: item.isVariableMeasure })}
            />
          </View>
        </View>
      </Card>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: "row", gap: 8, padding: 12 }}>
        <Pressable onPress={() => router.push("/orders")}>
          <Text style={{ color: colors.brand, fontWeight: "600" }}>My orders</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable onPress={() => logout()}>
          <Text style={{ color: colors.muted }}>Sign out</Text>
        </Pressable>
      </View>
      <FlatList
        data={menu?.items ?? []}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
        ListHeaderComponent={error ? <Banner tone="red">{error}</Banner> : null}
        ListEmptyComponent={<Text style={{ color: colors.muted, textAlign: "center", marginTop: 40 }}>No items available yet.</Text>}
      />
      {cart.count > 0 && (
        <View style={{ position: "absolute", left: 16, right: 16, bottom: 20 }}>
          <Button title={`View cart (${cart.count})`} onPress={() => router.push("/cart")} />
        </View>
      )}
    </View>
  );
}
