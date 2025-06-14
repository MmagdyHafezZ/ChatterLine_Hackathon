import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  ScrollView,
  Switch
} from "react-native";
import { UserData } from "./OnboardingFlow";

// Simple arrow right icon component
const ArrowRightIcon = () => (
  <Text style={styles.arrowIcon}>→</Text>
);

interface PreferencesStepProps {
  userData: UserData;
  onNext: () => void;
  onPrevious: () => void;
  onUpdate: (data: Partial<UserData>) => void;
}

const interestOptions = [
  { id: "sales", label: "Make a sales call", icon: "💻" },
  { id: "family", label: "Calling friends and family", icon: "🏃‍♂️" },
  { id: "food", label: "Ordering food", icon: "🍳" },
];

export const PreferencesStep = ({ 
  userData, 
  onNext, 
  onPrevious, 
  onUpdate 
}: PreferencesStepProps) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleInterestToggle = (interestId: string) => {
    const currentInterests = userData.interests;
    const updatedInterests = currentInterests.includes(interestId)
      ? currentInterests.filter(id => id !== interestId)
      : [...currentInterests, interestId];
    
    onUpdate({ interests: updatedInterests });
  };

  const handleNotificationToggle = (enabled: boolean) => {
    onUpdate({ notifications: enabled });
  };

  const renderInterestButton = (interest: typeof interestOptions[0]) => {
    const isSelected = userData.interests.includes(interest.id);
    
    return (
      <TouchableOpacity
        key={interest.id}
        style={[
          styles.interestButton,
          isSelected ? styles.interestButtonSelected : styles.interestButtonDefault
        ]}
        onPress={() => handleInterestToggle(interest.id)}
        activeOpacity={0.8}
      >
        <Text style={styles.interestIcon}>{interest.icon}</Text>
        <Text style={[
          styles.interestLabel,
          isSelected ? styles.interestLabelSelected : styles.interestLabelDefault
        ]}>
          {interest.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <View style={styles.header}>
          <Text style={styles.title}>What interests you?</Text>
          <Text style={styles.subtitle}>
            Select your interests to help us customize your experience
          </Text>
        </View>

        <View style={styles.contentContainer}>
          {/* Interests Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Choose your interests</Text>
            <View style={styles.interestsGrid}>
              {interestOptions.map(renderInterestButton)}
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
            style={[styles.button, styles.continueButton]} 
            onPress={onNext}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
            <ArrowRightIcon />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827', // gray-900
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280', // gray-600
    textAlign: 'center',
  },
  contentContainer: {
    marginBottom: 32,
    gap: 24,
  },
  section: {
    width: '100%',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151', // gray-700
    marginBottom: 16,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  interestButton: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
  },
  interestButtonDefault: {
    borderColor: '#e5e7eb', // gray-200
    backgroundColor: '#ffffff',
  },
  interestButtonSelected: {
    borderColor: '#3b82f6', // blue-500
    backgroundColor: '#eff6ff', // blue-50
  },
  interestIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  interestLabel: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  interestLabelDefault: {
    color: '#374151', // gray-700
  },
  interestLabelSelected: {
    color: '#1d4ed8', // blue-700
  },
  notificationSection: {
    backgroundColor: '#f9fafb', // gray-50
    borderRadius: 12,
    padding: 16,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notificationText: {
    flex: 1,
    marginRight: 16,
  },
  notificationLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151', // gray-700
    marginBottom: 4,
  },
  notificationDescription: {
    fontSize: 12,
    color: '#6b7280', // gray-500
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
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6', // blue-500
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginRight: 8,
  },
  arrowIcon: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});