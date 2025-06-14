import React from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  Animated,
  Easing 
} from "react-native";
import { UserData } from "./OnboardingFlow";
import { UserProfile } from "../../types";
import { useUserStore } from "../../store/userStore";

// You'll need to install react-native-vector-icons or use a custom icon
// For now, I'll create a simple checkmark component
const CheckIcon = () => (
  <View style={styles.checkIcon}>
    <Text style={styles.checkText}>✓</Text>
  </View>
);

interface CompletionStepProps {
  userData: UserData;
  onComplete: () => void, 
  onPrevious: () => void;
}

export const CompletionStep = ({ userData, onComplete, onPrevious }: CompletionStepProps) => {
  const { setProfile } = useUserStore();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const userInfo: UserProfile = {
    phone: userData.phone,
    email: userData.email,
    firstName: userData.firstName,
    lastName: userData.lastName,
    interests: userData.interests,
  }

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={styles.gradientCircle}>
            <CheckIcon />
          </View>
        </View>
        
        <Text style={styles.title}>You're all set!</Text>
        
        <Text style={styles.subtitle}>
          Welcome to the app, {userData.firstName}! Your profile has been created successfully.
        </Text>
      </View>

      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Your Profile Summary</Text>
        
        <View style={styles.summaryContent}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Name:</Text>
            <Text style={styles.summaryValue}>
              {userData.firstName} {userData.lastName}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Email:</Text>
            <Text style={styles.summaryValue}>{userData.email}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phone:</Text>
            <Text style={styles.summaryValue}>{userData.phone}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Interests:</Text>
            <Text style={styles.summaryValue}>
              {userData.interests.length} selected
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Notifications:</Text>
            <Text style={styles.summaryValue}>
              {userData.notifications ? "Enabled" : "Disabled"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.backButton]} 
          onPress={onPrevious}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={() => {
            setProfile(userInfo)
            onComplete()
          }
          }
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    marginBottom: 24,
  },
  gradientCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#10b981', // green-500
    justifyContent: 'center',
    alignItems: 'center',
    // For a gradient effect, consider using react-native-linear-gradient
    shadowColor: '#10b981',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  checkIcon: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkText: {
    fontSize: 32,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827', // gray-900
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#6b7280', // gray-600
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 16,
  },
  summaryContainer: {
    backgroundColor: '#f0f9ff', // blue-50 equivalent
    borderRadius: 12,
    padding: 24,
    marginBottom: 32,
    width: '100%',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827', // gray-900
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryContent: {
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#374151', // gray-700
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151', // gray-700
    flex: 1,
    textAlign: 'right',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#d1d5db', // gray-300
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151', // gray-700
  },
  primaryButton: {
    backgroundColor: '#10b981', // green-500
    shadowColor: '#10b981',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});