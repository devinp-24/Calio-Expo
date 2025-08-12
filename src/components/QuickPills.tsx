// src/components/QuickPills.tsx
import React, {
  useEffect,
  useMemo,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";

type QuickPillsProps = {
  /** Fixed list for now */
  items?: string[];
  /** Optional generator for tomorrow (can be sync or async) */
  getItems?: () => string[] | Promise<string[]>;
  /** Called when a pill is tapped */
  onPress?: (text: string, index: number) => void;
  /** Distance from the bottom; place above input bar */
  bottomOffset: number;
  /** Hide/show entire strip */
  visible?: boolean;
  /** Style overrides if needed */
  containerStyle?: object;
  pillStyle?: object;
  textStyle?: object;
};

export type QuickPillsRef = {
  refresh: () => void;
};

const QuickPills = forwardRef<QuickPillsRef, QuickPillsProps>(
  function QuickPills(
    {
      items,
      getItems,
      onPress,
      bottomOffset,
      visible = true,
      containerStyle,
      pillStyle,
      textStyle,
    },
    ref
  ) {
    const [internal, setInternal] = useState<string[]>(items ?? []);

    // Load/generate when using getItems (tomorrow),
    // else mirror controlled items (today).
    const load = async () => {
      if (getItems) {
        const out = await Promise.resolve(getItems());
        setInternal(out ?? []);
      } else {
        setInternal(items ?? []);
      }
    };

    useEffect(() => {
      load();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items, getItems]);

    useImperativeHandle(ref, () => ({
      refresh: () => void load(),
    }));

    const data = useMemo(() => internal ?? [], [internal]);

    if (!visible) return null;

    return (
      <View style={[styles.wrapper, { bottom: bottomOffset }, containerStyle]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {data.map((txt, i) => (
            <TouchableOpacity
              key={`${txt}-${i}`}
              style={[styles.pill, pillStyle]}
              onPress={() => onPress?.(txt, i)}
              activeOpacity={0.8}
            >
              <Text style={[styles.pillText, textStyle]} numberOfLines={1}>
                {txt}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }
);

export default QuickPills;

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 48,
    alignItems: "center",
  },
  row: {
    paddingHorizontal: 16,
    alignItems: "center",
  },
  pill: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 12,
    backgroundColor: "#FFF",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 1 },
    }),
  },
  pillText: { fontSize: 14, color: "#333", maxWidth: 220 },
});
