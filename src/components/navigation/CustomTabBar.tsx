import React, { useEffect } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Pressable,
  SafeAreaView,
} from "react-native";
import { Text, useTheme } from "react-native-paper";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const { width } = Dimensions.get("window");
const TAB_WIDTH = width / 3;

interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

const CustomTabBar: React.FC<CustomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const theme = useTheme();
  const translateX = useSharedValue(state.index * TAB_WIDTH);

  useEffect(() => {
    // Animate indicator on index change
    translateX.value = withSpring(state.index * TAB_WIDTH, {
      damping: 16,
      stiffness: 200,
    });
  }, [state.index]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value + 10 }],
  }));

  const handlePress = (index: number, routeName: string) => {
    navigation.navigate(routeName);
  };

  const getIcon = (name: string) => {
    switch (name) {
      case "Profile":
        return "account-circle";
      case "Scheduler":
        return "calendar-clock";
      case "Call":
        return "phone";
      default:
        return "home";
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View
        style={[styles.container, { backgroundColor: theme.colors.surface }]}
      >
        <BlurView
          intensity={50}
          tint={theme.dark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />

        {/* Sliding Indicator */}
        <Animated.View
          style={[
            styles.indicator,
            { backgroundColor: theme.colors.primary },
            indicatorStyle,
          ]}
        />

        {/* Tabs */}
        <View style={styles.tabs}>
          {state.routes.map((route: any, index: number) => {
            const isFocused = state.index === index;
            const iconName = getIcon(route.name);
            return (
              <Pressable
                key={route.key}
                onPress={() => handlePress(index, route.name)}
                android_ripple={{
                  color: theme.colors.primary + "20",
                  borderless: true,
                }}
                style={styles.tabButton}
              >
                <Icon
                  name={iconName}
                  size={isFocused ? 28 : 24}
                  color={
                    isFocused
                      ? theme.colors.primary
                      : theme.colors.onSurfaceVariant
                  }
                />
                <Text
                  style={[
                    styles.label,
                    {
                      color: isFocused
                        ? theme.colors.primary
                        : theme.colors.onSurfaceVariant,
                      fontFamily: isFocused ? "Inter-Bold" : "Inter-Regular",
                    },
                  ]}
                >
                  {route.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  container: {
    flexDirection: "row",
    width: width - 32,
    marginHorizontal: 16,
    borderRadius: 30,
    overflow: "hidden",
    elevation: 10,
    height: 60,
  },
  tabs: {
    flexDirection: "row",
    flex: 1,
  },
  tabButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
  },
  label: {
    fontSize: 12,
    marginTop: 2,
  },
  indicator: {
    position: "absolute",
    bottom: 4,
    width: TAB_WIDTH - 50,
    height: 4,
    borderRadius: 2,
  },
});

export default CustomTabBar;
