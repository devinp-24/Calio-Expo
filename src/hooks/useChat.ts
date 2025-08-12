// src/hooks/useChat.ts
import { useState, useEffect, useRef } from "react";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import OpenAI from "openai";
import {
  greetingMemoryPrompt,
  freshSuggestionsPrompt,
  serviceTypePrompt,
  restaurantSuggestionsPrompt,
  orderDetailsPrompt,
} from "../prompts/systemPrompt";
import { chatWithAgent } from "../api/openai";
import * as Location from "expo-location";
import { Platform, Linking } from "react-native";
import { useAuth } from "../context/AuthContext";
import uuid from "react-native-uuid";
const VENDOR = {
  "uber-eats": {
    label: "Uber Eats",
    scheme: "ubereats://",
    iosStore: "https://apps.apple.com/app/ubereats-food-delivery/id1058959277",
    androidStore: "market://details?id=com.ubercab.eats",
    androidStoreWeb:
      "https://play.google.com/store/apps/details?id=com.ubercab.eats",
  },
  doordash: {
    label: "DoorDash",
    scheme: "doordash://",
    iosStore: "https://apps.apple.com/app/doordash-food-delivery/id719972451",
    androidStore: "market://details?id=com.dd.doordash",
    androidStoreWeb:
      "https://play.google.com/store/apps/details?id=com.dd.doordash",
  },
  boons: {
    label: "Boons",
    scheme: "boons://",
    iosStore: "https://apps.apple.com/us/app/boons-local-food-delivery/id6504396870", 
    androidStore: "market://details?id=com.boons.boons", 
    androidStoreWeb: "https://www.boons.io/order",
  },
} as const;
type VendorKey = keyof typeof VENDOR;

async function openVendor(vendor: VendorKey) {
  const v = VENDOR[vendor];
  if (Platform.OS === "ios") {
    const can = await Linking.canOpenURL(v.scheme);
    if (can) return Linking.openURL(v.scheme);
    return Linking.openURL(v.iosStore);
  } else {
    try {
      const can = await Linking.canOpenURL(v.scheme);
      if (can) return Linking.openURL(v.scheme);
    } catch {}
    try {
      return Linking.openURL(v.androidStore);
    } catch {
      return Linking.openURL(v.androidStoreWeb);
    }
  }
}

export type Button = {
  label: string;
  value?: string;
  style?: string;
  url?: string;
};

type NearbyApiItem = {
  name: string;
  rating?: number; // <- required
  eta?: number;
  image_url?: string;
};

export type Message = {
  role: "system" | "user" | "assistant";
  content: string;
  buttons?: Button[];
};

type Memory = {
  lastOrder?: string | null;
  cuisine?: string | null;
  mood?: string | null;
  occasion?: string | null;
  serviceType?: string | null;
  restaurantOptions?: any[];
  selectedRestaurant?: string | null;
};

const { extra } = Constants.manifest2 ?? Constants.expoConfig ?? {};
const API_BASE: string = extra?.API_BASE ?? "http://192.168.3.190:3001/api";

export function useChat() {
  const pageRef = useRef(0);
  const allRestaurantsRef = useRef<any[]>([]);
  const fullOptionsRef = useRef<any[]>([]);
  const { username } = useAuth();

  const extractor = new OpenAI({
    apiKey: "",
    dangerouslyAllowBrowser: true,
  });
  const [quickPill, setQuickPill] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [memory, setMemory] = useState<Memory | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [askedService, setAskedService] = useState(false);
  const [suggestionsShown, setSuggestionsShown] = useState(false);
  const [restaurantOptions, setRestaurantOptions] = useState<any[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string | null>(
    null
  );
  const [restaurantCards, setRestaurantCards] = useState<
    {
      name: string;
      rating?: number; // <- optional
      eta: number;
      description: string;
      imageUrl?: string;
    }[]
  >([]);

  const [suggestions, setSuggestions] = useState<string[]>([]);

  async function persistMemory(updates: Partial<Memory>) {
    if (!userId) {
      console.warn("[useChat] ⚠️ persistMemory aborted: no userId");
      return;
    }
    const res = await fetch(`${API_BASE}/user/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...updates,
        timestamp: new Date().toISOString(),
      }),
    });
  }

  const fullExtractorPrompt = `
You are a JSON extractor. Given a user’s message, return EXACTLY a JSON object with these keys:
  - "cuisine": the name of any cuisine or dish the user is actively requesting or positively expressing a desire for; otherwise null.
  - "mood": a short adjective or phrase capturing the user’s emotional state; otherwise null.
  - "occasion": a short phrase for the situation or reason for the meal; otherwise null.
  - "serviceType": one of "delivery", "pickup", or "dine-in" if the user explicitly mentions wanting that; otherwise null.

Rules:
1. Only fill “cuisine” if the user asks for, requests, or expresses a positive desire for a specific dish or cuisine.  
2. If the user merely mentions a dish (e.g. “never recommend salad to me”) or expresses dislike/rejection, “cuisine” must be null.  
3. Do not hardcode any specific foods—apply rule #1 and #2 generally.  
4. Do not output any text besides the JSON object.

`.trim();

  const slimExtractorPrompt = `
You are a JSON extractor. Given a user’s message, return EXACTLY a JSON object with:
  - "cuisine": the name of any cuisine or dish the user is actively requesting or positively expressing a desire for; otherwise null.

  - "mood": a short adjective or phrase capturing the user’s emotional state; otherwise null.
  - "occasion": a short phrase for the situation or reason for the meal; otherwise null.
  - "serviceType": one of "delivery", "pickup", or "dine-in" if the user explicitly mentions wanting that; otherwise null.
Respond with only the JSON object—no extra text.
`.trim();

  // Fun pool to draw from
  const SURPRISE_CUISINES = [
    "Nikkei (Japanese–Peruvian)",
    "Georgian supra feast",
    "Oaxacan mole",
    "Kaiseki",
    "Sichuan hot pot",
    "New Nordic",
    "Ethiopian injera platter",
    "Laotian",
    "Uzbek plov",
    "Peranakan (Nyonya)",
    "Basque pintxos",
    "Yakitori omakase",
    "Yucatecan cochinita",
    "Keralan seafood",
    "Levantine mezze",
    "Hunan",
    "Sardinian",
    "Filipino kamayan",
    "Jamaican jerk",
    "Molecular gastronomy tasting",
  ];

  // One-liner crafted by OpenAI
  const surpriseLinePrompt = `
You are a playful food assistant. The user said "Surprise me".
Write ONE short line (<= 18 words) that warmly acknowledges the surprise
and reveals the chosen cuisine as: "{cuisine}".
No bullet points. Keep it breezy and simple.
`.trim();

  const pickRandomCuisine = (exclude?: string) => {
    const pool = SURPRISE_CUISINES.filter((c) => c !== exclude);
    return pool[Math.floor(Math.random() * pool.length)];
  };

  // NEW: we keep the chosen cuisine here until the user confirms
  const [pendingSurprise, setPendingSurprise] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      let id = await AsyncStorage.getItem("foodAgentUserId");
      if (!id) {
        id = uuid.v4().toString();
        await AsyncStorage.setItem("foodAgentUserId", id);
      }
      setUserId(id);
      try {
        const res = await fetch(`${API_BASE}/user/${id}`);
        setMemory(res.ok ? await res.json() : {});
      } catch {
        setMemory({});
      }
    })();
  }, []);

  useEffect(() => {
    const update = () => setQuickPill(mealForHour(new Date().getHours()));
    update();
    const id = setInterval(update, 60 * 1000); // optional
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (messages.length > 0) return;

    (async () => {
      setLoading(true);

      const hour = new Date().getHours();
      const tod = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";

      let ctx = `Context — timeOfDay: ${tod}.`;

      if (memory?.lastOrder) ctx += ` lastOrder: ${memory.lastOrder}.`;
      if (memory?.cuisine) ctx += ` favoriteCuisine: ${memory.cuisine}.`;
      if (memory?.mood) ctx += ` mood: ${memory.mood}.`;
      if (memory?.occasion) ctx += ` occasion: ${memory.occasion}.`;

      const prompt = memory?.cuisine
        ? `${ctx}\n\n${greetingMemoryPrompt}`
        : `${ctx}\n\n${freshSuggestionsPrompt.replace(
            "{userName}",
            username ?? "there"
          )}`;

      const aiRaw = await chatWithAgent([], prompt);
      const aiMsg: Message = {
        role: aiRaw.role as any,
        content: aiRaw.content ?? "",
      };
      setMessages([aiMsg]);

      setLoading(false);

      if (memory && memory.cuisine) {
        setSuggestions([
          "Have that again",
          "Try something new",
          "Show me Italian",
          "What’s popular?",
        ]);
      } else {
        setSuggestions([
          "Recommend something",
          "Surprise me",
          "Show me vegan",
          "What Food is Trending",
        ]);
      }
    })();
  }, [messages.length]);

  const mapNearbyToCards = (rows: NearbyApiItem[]) =>
    rows.map((r) => ({
      name: r.name ?? "Unknown",
      rating: typeof r.rating === "number" ? r.rating : undefined, // ← was 0
      eta: typeof r.eta === "number" ? r.eta : 10,
      description: "",
      imageUrl: r.image_url ?? undefined,
    }));
  async function handleAssistantButton(value?: string) {
    if (!value) return;

    
    if (value === "uber-eats" || value === "doordash" || value === "boons") {
    return orderWithApp(value as VendorKey); 
  }

    // Service-type buttons → reuse your pipeline
    if (value === "delivery" || value === "pickup" || value === "dine-in") {
      
      // This will append a user bubble and trigger the existing logic
      return sendMessage(
        value === "dine-in"
          ? "Dine-in"
          : value[0].toUpperCase() + value.slice(1)
      );
    }

    // fallback: treat as a simple user reply
    return sendMessage(value);
  }

  async function askServiceType(cuisine: string, history: Message[]) {
    setAskedService(true);
    setLoading(true);
    const prompt = serviceTypePrompt.replace("{cuisine}", cuisine);
    const svcRaw = await chatWithAgent(history, prompt);
    const withButtons: Message = {
      role: svcRaw.role as any,
      content: svcRaw.content ?? "",
      buttons: [
        { label: "Delivery", value: "delivery", style: "secondary" },
        { label: "Pickup", value: "pickup", style: "secondary" },
        { label: "Dine-in", value: "dine-in", style: "secondary" },
      ],
    };
    setMessages((ms) => [...ms, withButtons]);
    setLoading(false);
  }

  async function normal(history: Message[]) {
    setAskedService(false);
    setLoading(true);

    const msgRaw = await chatWithAgent(history, orderDetailsPrompt);
    const msg: Message = {
      role: msgRaw.role as any,
      content: msgRaw.content ?? "",
    };
    setMessages((ms) => [...ms, msg]);
    setLoading(false);
  }

  // --- ✨ NEW: Nearby flow (inside this hook file) ---
  async function showNearbyOptions(): Promise<void> {
    if (loading) return; // guard
    setLoading(true);

    // 0) show the user's tap as a bubble (same behavior as other pills)
    setMessages((ms) => [...ms, { role: "user", content: "📍 Nearby" }]);

    try {
      // 1) permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setMessages((ms) => [
          ...ms,
          { role: "assistant", content: "I couldn’t access your location." },
        ]);
        return;
      }

      // 2) coords
      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = coords;

      // 3) fetch nearby (limit server-side to 30)
      const url =
        `${API_BASE}/restaurants/nearby?lat=${encodeURIComponent(latitude)}` +
        `&lon=${encodeURIComponent(longitude)}&limit=30`;

      let rows: NearbyApiItem[] = [];
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        rows = Array.isArray(json) ? json : json?.results ?? [];
      } catch (err) {
        console.warn("[nearby] request failed:", err);
        rows = [];
      }

      if (!rows.length) {
        setMessages((ms) => [
          ...ms,
          {
            role: "assistant",
            content: "I couldn’t find any nearby restaurants.",
          },
        ]);
        return;
      }

      // 4) 3-at-a-time pagination (reuse your existing 'more' flow)
      allRestaurantsRef.current = rows as any[];
      pageRef.current = 0;

      const first3 = rows.slice(0, 3);
      fullOptionsRef.current = first3 as any[];
      setSuggestionsShown(true);
      setSelectedRestaurant(null);
      if (suggestions.length) setSuggestions([]);

      // 5) assistant line ABOVE the cards
      setMessages((ms) => [
        ...ms,
        { role: "assistant", content: "Here are some nearby spots:" },
      ]);

      // allow the assistant bubble to mount before anchoring the cards
      await new Promise((r) => setTimeout(r, 0));

      // 6) show only the first 3 cards now
      setRestaurantCards(
        first3.map((r) => ({
          name: r.name ?? "Unknown",
          rating: typeof r.rating === "number" ? r.rating : undefined, // optional
          eta: typeof r.eta === "number" ? r.eta : 10,
          description: "",
          imageUrl: r.image_url ?? undefined,
        }))
      );
    } catch (e) {
      console.warn("[nearby] unexpected error:", e);
      setMessages((ms) => [
        ...ms,
        {
          role: "assistant",
          content: "Sorry—something went wrong fetching nearby places.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function showSurpriseMe(): Promise<void> {
    if (loading) return;
    setLoading(true);

    // user bubble
    const userMsg: Message = { role: "user", content: "🎲 Surprise me" };
    setMessages((ms) => [...ms, userMsg]);

    try {
      const pick = pickRandomCuisine();
      setPendingSurprise(pick); // <- do NOT write to memory yet

      const aiRaw = await chatWithAgent(
        [...messages, userMsg],
        surpriseLinePrompt.replace("{cuisine}", pick)
      );
      const aiMsg: Message = {
        role: aiRaw.role as any,
        content: aiRaw.content ?? `Fun choice—let’s try ${pick}.`,
      };
      setMessages((ms) => [...ms, aiMsg]);
      // now we wait for the user's confirmation/denial in sendMessage()
    } catch (e) {
      console.warn("[surprise] error:", e);
      setMessages((ms) => [
        ...ms,
        {
          role: "assistant",
          content: "Hmm, surprise fizzled. Want to try again?",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function selectRestaurant(idx: number) {
    const picked = fullOptionsRef.current[idx];
    setSelectedRestaurant(picked.name);
    await persistMemory({ selectedRestaurant: picked.name });

    const linkMsg: Message = {
      role: "assistant",
      content: `Great choice—**${picked.name}** it is! How would you like to order?`,
      buttons: [
        // { label: "Order with Uber Eats", value: "uber-eats", style: "primary" },
        // { label: "Order with DoorDash", value: "doordash", style: "primary" },
        { label: "Order with boons", value: "boons", style: "primary" },
      ],
    };

    setMessages((ms) => [...ms, linkMsg]);
  }

  async function orderWithApp(vendor: VendorKey) {
    const appLabel = VENDOR[vendor].label;
    const rname =
      selectedRestaurant ??
      fullOptionsRef.current?.[0]?.name ??
      "this restaurant";

    // 1) user bubble
    setMessages((ms) => [
      ...ms,
      { role: "user", content: `Order with ${appLabel}` },
    ]);

    // 2) assistant ack
    setMessages((ms) => [
      ...ms,
      {
        role: "assistant",
        content: `Awesome — opening ${appLabel} for **${rname}**. Enjoy!`,
      },
    ]);

    // 3) deep-link to app or store
    try {
      await openVendor(vendor);
    } catch (e) {
      console.warn("openVendor failed", e);
    }
  }

  async function classifyAffirmation(text: string, last: string) {
    const res = await extractor.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are a JSON classifier.  I will give you two pieces of information:
1) The assistant's question.
2) The user's reply to that question.

Decide whether the user is **affirming** (agreeing/confirming) or **denying** (refusing/rejecting) that specific question.

Return EXACTLY one JSON object with:
  "intent": either "affirm" or "deny"

Respond with only the JSON object—no extra text.
        `.trim(),
        },
        { role: "assistant", content: last },
        { role: "user", content: text },
      ],
      temperature: 0,
      max_tokens: 10,
    });

    const choice = res.choices?.[0]?.message?.content;
    if (!choice) {
      throw new Error("classifyAffirmation: no response from OpenAI");
    }

    const jsonRaw = choice.match(/\{[\s\S]*\}/)?.[0] ?? "{}";
    const parsed = JSON.parse(jsonRaw);
    return parsed.intent === "affirm" ? "affirm" : "deny";
  }

  async function classifyRestaurantReply(text: string, last: Message) {
    const res = await extractor.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
 You are a JSON classifier. The user has just been shown three restaurants.

 Return EXACTLY one JSON object with:
   "action": one of:
     - "pick"    (they are choosing one of the 3; e.g. "1", "two", "Pure Punjabi")
     - "more"    (they explicitly request MORE results with words like "more", "another", "show more")
     - "change"  (they want to start over or change cuisine: "I change my mind", "something else")
     - "none"    (any other reply, like "what will you suggest?", follow-up questions, etc.)

 If "pick", also include:
   "selection": the 1-based index (1,2,3) or the exact restaurant name.

 Only return the JSON object—no extra text.
         `.trim(),
        },
        { role: "assistant", content: last.content },
        { role: "user", content: text },
      ],
      temperature: 0,
      max_tokens: 60,
    });
    const choiceContent = res.choices?.[0]?.message?.content;
    if (!choiceContent) {
      throw new Error("classifyRestaurantReply: no response from OpenAI");
    }

    const jsonRaw = choiceContent.match(/\{[\s\S]*\}/)?.[0] ?? "{}";
    const parsed = JSON.parse(jsonRaw) as {
      action?: string;
      selection?: string | number;
    };

    return {
      action:
        parsed.action === "pick" ||
        parsed.action === "more" ||
        parsed.action === "change"
          ? parsed.action
          : "none",
      selection: parsed.selection,
    };
  }

  async function classifyChangeOfMind(text: string) {
    const res = await extractor.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are a JSON classifier.  The user may say something that indicates they want to restart the ordering flow 
– e.g. changing their mind, not ready to order, etc.

Return EXACTLY a JSON object with:
  { "changeMind": true } if they are asking to start over
  { "changeMind": false } otherwise

Respond with ONLY the JSON object—no extra text.
        `.trim(),
        },
        { role: "user", content: text },
      ],
      temperature: 0,
      max_tokens: 10,
    });
    const content = res.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("classifyChangeOfMind: no response from OpenAI");
    }

    const jsonRaw = content.match(/\{[\s\S]*\}/)?.[0] ?? "{}";
    const parsed = JSON.parse(jsonRaw) as { changeMind?: boolean };

    return parsed.changeMind === true;
  }

  function mealForHour(h: number): string {
    const breakfast = ["Give me Breakfast ideas"];

    const lunch = ["Give me Lunch ideas"];

    const dinner = ["Give me Dinner ideas"];

    const snack = ["Give me Snack ideas"];

    // pick pool by hour (same ranges you had)
    let pool = snack;
    if (h >= 5 && h < 11) pool = breakfast;
    else if (h >= 11 && h < 17) pool = lunch;
    else if (h >= 17 && h < 21) pool = dinner;

    // stable-ish selection within the current hour/day
    const now = new Date();
    const seed = (h + now.getDate() + 31 * now.getMonth()) % pool.length;
    return pool[seed];
  }

  const sendMessage = async (text: string) => {
    console.log("[useChat] ▶ sendMessage:", text);

    const trimmed = text.trim();
    if (!trimmed || loading) return;
    if (suggestions.length) setSuggestions([]);
    const userMsg: Message = { role: "user", content: trimmed };
    setMessages((ms) => [...ms, userMsg]);

    if (messages.length === 1 && memory?.cuisine) {
      setLoading(true);
      const intent = await classifyAffirmation(trimmed, messages[0].content);
      setLoading(false);
      if (intent === "affirm") {
        await persistMemory({ cuisine: memory.cuisine! });
        return askServiceType(memory.cuisine!, [...messages, userMsg]);
      }
      if (intent === "deny") {
        await persistMemory({ cuisine: null });
        return normal([...messages, userMsg]);
      }
    }

    let cuisine: string | null = null;
    let mood: string | null = null;
    let occasion: string | null = null;
    let serviceType: string | null = null;

    const useSlim = Boolean(memory?.cuisine && askedService);
    const prompt = useSlim ? slimExtractorPrompt : fullExtractorPrompt;

    try {
      const resp = await extractor.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: trimmed },
        ],
        temperature: 0,
        max_tokens: 60,
      });
      const content = resp.choices?.[0]?.message?.content ?? "";
      const rawJson = content.match(/\{[\s\S]*\}/)?.[0] ?? "{}";
      const obj = JSON.parse(rawJson) as {
        cuisine?: string;
        mood?: string;
        occasion?: string;
        serviceType?: string;
      };
      cuisine = obj.cuisine ?? null;
      mood = obj.mood ?? null;
      occasion = obj.occasion ?? null;
      serviceType = obj.serviceType ?? null;
    } catch (e) {
      console.error("Slot extraction failed:", e);
    }

    if (cuisine && cuisine !== memory?.cuisine) {
      setAskedService(false);
      setSuggestionsShown(false);
      fullOptionsRef.current = [];
      setRestaurantOptions([]);
      setSelectedRestaurant(null);
    }

    const updates: Partial<Memory> = { lastOrder: trimmed };
    if (cuisine !== undefined) updates.cuisine = cuisine;
    if (mood !== undefined) updates.mood = mood;
    if (occasion !== undefined) updates.occasion = occasion;
    if (serviceType !== undefined) updates.serviceType = serviceType;
    setMemory((m) => ({ ...(m ?? {}), ...updates }));
    await persistMemory(updates);

    const curCuisine = cuisine ?? memory?.cuisine;
    const curService = serviceType ?? memory?.serviceType;
    if (curCuisine && !curService && !askedService) {
      return askServiceType(curCuisine, [...messages, userMsg]);
    }

    if (cuisine && cuisine !== memory?.cuisine) {
      setMemory((m) => ({ ...(m ?? {}), cuisine }));
      await persistMemory({ cuisine });
      return askServiceType(cuisine, [...messages, userMsg]);
    }
    if (pendingSurprise) {
      setLoading(true);
      try {
        // look at the last assistant line (the surprise one-liner)
        const lastAssistant = [...messages]
          .reverse()
          .find((m) => m.role === "assistant");
        const lastText = lastAssistant?.content ?? "Do you want that cuisine?";

        const intent = await classifyAffirmation(trimmed, lastText);
        if (intent === "affirm") {
          // user accepts → now commit cuisine and continue normal flow
          setMemory((m) => ({ ...(m ?? {}), cuisine: pendingSurprise }));
          await persistMemory({ cuisine: pendingSurprise });

          setPendingSurprise(null);
          setAskedService(false);
          setSuggestionsShown(false);
          fullOptionsRef.current = [];
          allRestaurantsRef.current = [];
          pageRef.current = 0;
          setRestaurantOptions([]);
          setRestaurantCards([]);
          setSelectedRestaurant(null);

          // ask service type for the chosen cuisine
          setLoading(false);
          return askServiceType(pendingSurprise, [...messages, userMsg]);
        }

        // deny/ambiguous → offer another surprise
        const nextPick = pickRandomCuisine(pendingSurprise);
        setPendingSurprise(nextPick);

        const aiRaw = await chatWithAgent(
          [...messages, userMsg],
          surpriseLinePrompt.replace("{cuisine}", nextPick)
        );
        const aiMsg: Message = {
          role: aiRaw.role as any,
          content: aiRaw.content ?? `No problem—how about ${nextPick}?`,
        };
        setMessages((ms) => [...ms, aiMsg]);
      } catch (e) {
        console.warn("[surprise confirm] error:", e);
        setMessages((ms) => [
          ...ms,
          {
            role: "assistant",
            content: "Got it. Want another surprise cuisine?",
          },
        ]);
      }
      setLoading(false);
      return; // stop the rest of sendMessage while we’re in the surprise loop
    }

    if (curCuisine && curService && !suggestionsShown) {
      setSuggestionsShown(true);
      setLoading(true);
      let list: Array<{
        name: string;
        rating: number;
        eta: number;
        reservationLink?: string;
        slug?: string;
      }> = [];
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") throw new Error("Location denied");
        const { coords } = await Location.getCurrentPositionAsync();
        const { latitude, longitude } = coords;
        console.log("latitude: " + latitude);
        console.log("longitude: " + longitude);
        console.log(
          "API:: " +
            `${API_BASE}/restaurants?lat=${latitude}&lon=${longitude}` +
            `&cuisine=${encodeURIComponent(curCuisine)}`
        );

        try {
          const res = await fetch(
            `${API_BASE}/restaurants?lat=${latitude}&lon=${longitude}` +
              `&cuisine=${encodeURIComponent(curCuisine)}`
          );
          list = (await res.json()) as typeof list;
        } catch (err) {
          console.warn("real API failed, using mock restaurants:", err);
        }

        // if the real API gave us nothing, or failed entirely, inject some mocks:
        if (!list || list.length === 0) {
          list = [
            { name: "Mock Sushi Bar", rating: 4.7, eta: 25 },
            { name: "Demo Burger Joint", rating: 4.3, eta: 20 },
            { name: "Test Vegan Cafe", rating: 4.5, eta: 15 },
            { name: "Sample Pizza Place", rating: 4.2, eta: 30 },
            { name: "Placeholder Diner", rating: 4.0, eta: 18 },
          ];
        }

        allRestaurantsRef.current = list;
        pageRef.current = 0;

        const first3 = list.slice(0, 3);
        fullOptionsRef.current = first3;
        const mini = first3.map((r: any) => ({
          name: r.name,
          rating: r.rating,
          eta: r.eta,
        }));
        // setRestaurantOptions(mini);
        // await persistMemory({ restaurantOptions: mini });
        const cards = first3.map((r: any) => ({
          name: r.name,
          rating: r.rating,
          eta: r.eta,
          description: "",
          imageUrl: r.image_url,
        }));
        setRestaurantCards(cards);
        // await persistMemory({ restaurantOptions: mini });

        // const textList = first3
        //   .map(
        //     (r: any) =>
        //       `- ${r.name} (${r.rating}★, ${
        //         curService === "delivery"
        //           ? `${r.eta} min delivery`
        //           : curService === "pickup"
        //           ? `${r.eta} min pickup`
        //           : `reserve: ${r.reservationLink || r.slug}`
        //       })`
        //   )
        //   .join("\n");
        // const sumPrompt = restaurantSuggestionsPrompt
        //   .replace("{cuisine}", curCuisine)
        //   .replace("{serviceType}", curService);

        // const sugRaw = await chatWithAgent(
        //   [{ role: "user", content: textList }],
        //   sumPrompt
        // );
        // const sugMsg: Message = {
        //   role: sugRaw.role as any,
        //   content: sugRaw.content ?? "",
        // };
        // setMessages((ms) => [...ms, sugMsg]);
      } catch (e) {
        console.error("Restaurant lookup failed:", e);
      }
      setLoading(false);
      return;
    }

    if (suggestionsShown && !selectedRestaurant) {
      setLoading(true);
      let decision: any = {};
      try {
        decision = await classifyRestaurantReply(
          trimmed,
          messages[messages.length - 1]
        );
      } catch (e) {
        console.error("Choice classification failed:", e);
      }
      setLoading(false);

      switch (decision.action) {
        case "change":
          fullOptionsRef.current = [];
          pageRef.current = 0;
          setRestaurantOptions([]); // clear mini‐list
          setRestaurantCards([]); // clear full cards
          setSuggestionsShown(false); // allow new suggestions in next turn

          return normal([...messages, userMsg]);
        case "more":
          pageRef.current++;
          const start = pageRef.current * 3;
          const next3 = allRestaurantsRef.current.slice(start, start + 3);
          if (!next3.length) return normal([...messages, userMsg]);

          fullOptionsRef.current = next3;
          const mini = next3.map((r: any) => ({
            name: r.name,
            rating: r.rating,
            eta: r.eta,
          }));
          // setRestaurantOptions(mini);
          // await persistMemory({ restaurantOptions: mini });

          const cards = next3.map((r: any) => ({
            name: r.name,
            rating: r.rating,
            eta: r.eta,
            description: "",
            imageUrl: r.image_url,
          }));
          setRestaurantCards(cards);
          // await persistMemory({ restaurantOptions: mini });

          // const textList2 = next3
          //   .map(
          //     (r: any) =>
          //       `- ${r.name} (${r.rating}★, ${
          //         curService === "delivery"
          //           ? `${r.eta} min delivery`
          //           : curService === "pickup"
          //           ? `${r.eta} min pickup`
          //           : `reserve: ${r.reservationLink || r.slug}`
          //       })`
          //   )
          //   .join("\n");
          // const sumPrompt2 = restaurantSuggestionsPrompt
          //   .replace("{cuisine}", curCuisine!)
          //   .replace("{serviceType}", curService!);
          // const moreRaw = await chatWithAgent(
          //   [{ role: "user", content: textList2 }],
          //   sumPrompt2
          // );
          // const moreMsg: Message = {
          //   role: moreRaw.role as any,
          //   content: moreRaw.content ?? "",
          // };
          // setMessages((ms) => [...ms, moreMsg]);
          return;
        case "pick":
          let idx: number;
          if (typeof decision.selection === "number") {
            idx = decision.selection - 1;
          } else {
            idx = fullOptionsRef.current.findIndex(
              (r: any) =>
                r.name.toLowerCase() === decision.selection.toLowerCase()
            );
          }
          if (idx >= 0) return selectRestaurant(idx);
      }

      const lc = trimmed.toLowerCase();
      const btnIdx = restaurantOptions.findIndex((b: any) => b.value === lc);
      if (btnIdx >= 0) return selectRestaurant(btnIdx);
      return normal([...messages, userMsg]);
    }

    setLoading(true);
    try {
      const aiRaw = await chatWithAgent([...messages, userMsg], undefined);
      const aiMsg: Message = {
        role: aiRaw.role as any,
        content: aiRaw.content ?? "",
      };
      setMessages((ms) => [...ms, aiMsg]);
    } catch (e) {
      console.error("Fallback chat failed:", e);
    }
    setLoading(false);
  };

  return {
    messages,
    loading,
    sendMessage,
    restaurantOptions,
    restaurantCards,
    selectedRestaurant,
    selectRestaurant,
    suggestions,
    quickPill,
    showNearbyOptions,
    showSurpriseMe,
    orderWithApp,
    handleAssistantButton,
  };
}
