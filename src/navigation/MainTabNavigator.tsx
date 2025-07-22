import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Stub views for each tab
function ChatHome() {
  return (
    <View style={styles.center}>
      <Text>Main Chat View (blank)</Text>
    </View>
  );
}
function Explore() {
  return (
    <View style={styles.center}>
      <Text>Explore View (blank)</Text>
    </View>
  );
}
function Fitness() {
  return (
    <View style={styles.center}>
      <Text>Fitness View (blank)</Text>
    </View>
  );
}
function Account() {
  return (
    <View style={styles.center}>
      <Text>Account View (blank)</Text>
    </View>
  );
}

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Chat"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: "#000",
          borderTopWidth: 0,
          paddingTop: 3,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: React.ComponentProps<typeof Ionicons>["name"] =
            "ellipse";
          if (route.name === "Chat") iconName = "chatbubble-outline";
          else if (route.name === "Explore") iconName = "planet-outline";
          else if (route.name === "Fitness") iconName = "barbell-outline";
          else if (route.name === "Account") iconName = "person-outline";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#ff6600",
        tabBarInactiveTintColor: "#999",
      })}
    >
      <Tab.Screen name="Chat" component={ChatHome} />
      <Tab.Screen name="Explore" component={Explore} />
      <Tab.Screen name="Fitness" component={Fitness} />
      <Tab.Screen name="Account" component={Account} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
