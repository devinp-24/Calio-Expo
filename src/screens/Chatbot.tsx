// // src/screens/Chatbot.tsx
// import React, { useState, useMemo } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   FlatList,
//   ActivityIndicator,
//   StyleSheet,
//   ScrollView,
//   ListRenderItemInfo,
// } from "react-native";
// import { useChat, Message } from "../hooks/useChat";
// import RestaurantCard from "../components/RestaurantCard";

// type ChatItem =
//   | { type: "text"; msg: Message }
//   | { type: "cards"; cards: ReturnType<typeof useChat>["restaurantCards"] };

// export default function Chatbot() {
//   const {
//     messages,
//     loading,
//     sendMessage,
//     suggestions,
//     restaurantCards,
//     selectedRestaurant,
//     selectRestaurant, // ← pull in the selector from your hook
//   } = useChat();

//   const [draft, setDraft] = useState("");

//   const onSend = (text: string) => {
//     sendMessage(text);
//     setDraft("");
//   };

//   // Merge chat bubbles + a single cards block (only if none picked yet)
//   const chatData: ChatItem[] = useMemo(() => {
//     const items: ChatItem[] = messages.map((m) => ({ type: "text", msg: m }));
//     if (!selectedRestaurant && restaurantCards.length > 0) {
//       items.push({ type: "cards", cards: restaurantCards });
//     }
//     return items;
//   }, [messages, restaurantCards, selectedRestaurant]);

//   const renderItem = ({ item }: ListRenderItemInfo<ChatItem>) => {
//     if (item.type === "text") {
//       const { role, content } = item.msg;
//       return (
//         <View
//           style={[
//             styles.bubble,
//             role === "user" ? styles.userBubble : styles.botBubble,
//           ]}
//         >
//           <Text style={styles.bubbleText}>{content}</Text>
//         </View>
//       );
//     } else {
//       // Render all cards in one block, passing the index into selectRestaurant
//       return (
//         <View style={styles.cardList}>
//           {item.cards.map((r, idx) => (
//             <RestaurantCard
//               key={r.name}
//               name={r.name}
//               rating={r.rating}
//               eta={r.eta}
//               description={r.description}
//               imageUrl={r.imageUrl}
//               onOrderPress={() => selectRestaurant(idx)} // ← fire selectRestaurant
//             />
//           ))}
//         </View>
//       );
//     }
//   };

//   return (
//     <View style={styles.container}>
//       {/* Chat + inline cards */}
//       <FlatList<ChatItem>
//         data={chatData}
//         keyExtractor={(_, i) => String(i)}
//         renderItem={renderItem}
//         contentContainerStyle={styles.chatArea}
//       />

//       {loading && <ActivityIndicator style={styles.loading} />}

//       {suggestions.length > 0 && (
//         <ScrollView
//           horizontal
//           showsHorizontalScrollIndicator={false}
//           contentContainerStyle={styles.suggestionRow}
//         >
//           {suggestions.map((opt, idx) => (
//             <TouchableOpacity
//               key={idx}
//               style={styles.suggestionButton}
//               onPress={() => onSend(opt)}
//               disabled={loading}
//             >
//               <Text style={styles.suggestionText}>{opt}</Text>
//             </TouchableOpacity>
//           ))}
//         </ScrollView>
//       )}

//       {/* Input bar */}
//       <View style={styles.inputRow}>
//         <TextInput
//           style={styles.input}
//           value={draft}
//           onChangeText={setDraft}
//           placeholder="Type a message..."
//           editable={!loading}
//         />
//         <TouchableOpacity
//           style={[styles.sendButton, loading && styles.sendDisabled]}
//           onPress={() => onSend(draft)}
//           disabled={loading}
//         >
//           <Text style={styles.sendButtonText}>Send</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#fff" },
//   chatArea: { padding: 16, paddingBottom: 0 },
//   bubble: {
//     marginVertical: 4,
//     padding: 12,
//     borderRadius: 8,
//     maxWidth: "80%",
//   },
//   userBubble: {
//     backgroundColor: "rgba(245, 124, 72, 1)",
//     alignSelf: "flex-end",
//   },
//   botBubble: {
//     backgroundColor: "#f0f0f0",
//     alignSelf: "flex-start",
//   },
//   bubbleText: { fontSize: 16 },

//   loading: { marginVertical: 8 },

//   suggestionRow: {
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//   },
//   suggestionButton: {
//     backgroundColor: "#f62d14",
//     padding: 12,
//     borderRadius: 8,
//     marginRight: 8,
//   },
//   suggestionText: {
//     color: "#fff",
//     fontSize: 16,
//   },

//   cardList: {
//     paddingTop: 16,
//     paddingBottom: 16,
//   },

//   inputRow: {
//     flexDirection: "row",
//     padding: 8,
//     borderTopWidth: 1,
//     borderColor: "#ddd",
//   },
//   input: {
//     flex: 1,
//     borderWidth: 1,
//     borderColor: "#ccc",
//     borderRadius: 20,
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     marginRight: 8,
//   },
//   sendButton: {
//     backgroundColor: "#f62d14",
//     borderRadius: 20,
//     paddingHorizontal: 16,
//     justifyContent: "center",
//   },
//   sendDisabled: {
//     backgroundColor: "#f62d14aa",
//   },
//   sendButtonText: { color: "#fff", fontWeight: "600" },
// });
