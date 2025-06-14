import React, { useEffect, useCallback } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useColorScheme } from "react-native";
import { Provider as PaperProvider } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";

import ProfileScreen from "./src/screens/ProfileScreen";
import { OnboardingFlow } from "./src/components/Onboarding/OnboardingFlow";
import SchedulerScreen from "./src/screens/SchedulerScreen";
import ExpoCallScreen from "./src/screens/ExpoCallScreen";
import { useThemeStore } from "./src/store/userStore";
import { enhancedDarkTheme, enhancedLightTheme } from "./src/utils/theme";
import ParticleBackground from "./src/components/animations/ParticleBackground";
import CustomTabBar from "./src/components/navigation/CustomTabBar";
import SplashScreenComponent from "./src/components/common/SplashScreen";
import SchedulerMainScreen from "./src/screens/SchedulerMainScreen";

// Keep splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const Tab = createBottomTabNavigator();

const App: React.FC = () => {
  const systemColorScheme = useColorScheme();
  const { isDarkMode, setDarkMode } = useThemeStore();

  const [appIsReady, setAppIsReady] = React.useState(false);
  const [isOnboarding, setIsOnboarding] = React.useState(true);
  const splashOpacity = useSharedValue(1);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make any API calls you need to do here
        await Font.loadAsync({
          "Inter-Regular": require("./assets/fonts/Inter-Regular.ttf"),
          "Inter-Bold": require("./assets/fonts/Inter-Bold.ttf"),
          "Inter-Black": require("./assets/fonts/Inter-Black.ttf"),
        });

        // Set up theme
        if (isDarkMode === null) {
          setDarkMode(systemColorScheme === "dark");
        }

        // Request notification permissions
        if (Device.isDevice) {
          const { status: existingStatus } =
            await Notifications.getPermissionsAsync();
          let finalStatus = existingStatus;

          if (existingStatus !== "granted") {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
          }

          if (finalStatus !== "granted") {
            console.log("Failed to get push token for push notification!");
          }
        }

        // Artificially delay for demonstration purposes
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, [systemColorScheme, isDarkMode, setDarkMode]);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // Hide splash screen with animation
      splashOpacity.value = withTiming(0, { duration: 800 }, () => {
        runOnJS(SplashScreen.hideAsync)();
      });
    }
  }, [appIsReady]);

  const splashStyle = useAnimatedStyle(() => ({
    opacity: splashOpacity.value,
  }));

  const theme = isDarkMode ? enhancedDarkTheme : enhancedLightTheme;

  const onComplete = () => {
    setIsOnboarding(false)
  }

  if (!appIsReady) {
    return <SplashScreenComponent />;
  }

  // if (isOnboarding) {
  //   return <OnboardingFlow onComplete={onComplete} />;
  // }

  return (
    <PaperProvider theme={theme}>
      <StatusBar style={isDarkMode ? "light" : "dark"} translucent />

      <Animated.View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        {/* Particle Background */}
        <ParticleBackground />

        <NavigationContainer theme={theme}>
          <Tab.Navigator
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{
              headerShown: false,
            }}
          >
            <Tab.Screen
              name="Profile"
              component={ProfileScreen}
              options={{
                tabBarIcon: "account-circle",
                tabBarLabel: "Profile",
              }}
            />
            <Tab.Screen
              name="Scheduler"
              component={SchedulerMainScreen}
              options={{
                tabBarIcon: "calendar-clock",
                tabBarLabel: "Schedule",
              }}
            />
            <Tab.Screen
              name="Call"
              component={ExpoCallScreen}
              options={{
                tabBarIcon: "phone",
                tabBarLabel: "Call",
              }}
            />
          </Tab.Navigator>
        </NavigationContainer>

        {/* Splash Screen Overlay */}
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1000,
              pointerEvents: appIsReady ? "none" : "auto",
            },
            splashStyle,
          ]}
        >
          <SplashScreenComponent />
        </Animated.View>
      </Animated.View>
    </PaperProvider>

  );
};

export default App;
