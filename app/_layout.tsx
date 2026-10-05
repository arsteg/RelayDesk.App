import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "@/state/auth";
import { CartProvider } from "@/state/cart";
import { colors } from "@/theme";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.brand },
              headerTintColor: "#fff",
              headerTitleStyle: { fontWeight: "700" },
              contentStyle: { backgroundColor: colors.bg },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ title: "Sign in" }} />
            <Stack.Screen name="accept" options={{ title: "Join" }} />
            <Stack.Screen name="menu" options={{ title: "Menu" }} />
            <Stack.Screen name="cart" options={{ title: "Your cart" }} />
            <Stack.Screen name="orders/index" options={{ title: "Your orders" }} />
            <Stack.Screen name="orders/[id]" options={{ title: "Order" }} />
          </Stack>
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
