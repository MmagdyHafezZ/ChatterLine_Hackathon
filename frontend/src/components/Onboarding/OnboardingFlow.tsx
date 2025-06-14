import React, { useState } from "react";
import { View, StyleSheet, SafeAreaView } from "react-native";
import { WelcomeStep } from "./WelcomeStep";
import { PersonalInfoStep } from "./PersonalInfoStep";
import { PreferencesStep } from "./PreferencesStep";
import { CompletionStep } from "./CompletionStep";
import { ProgressBar } from "./ProgressBar";

export interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  interests: string[];
  notifications: boolean;
}

interface OnboardingFlowProps {
  onComplete: () => void, 

}

export const OnboardingFlow = ({onComplete}: OnboardingFlowProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [userData, setUserData] = useState<UserData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    interests: [],
    notifications: true,
  });

  const totalSteps = 4;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateUserData = (data: Partial<UserData>) => {
    setUserData(prev => ({ ...prev, ...data }));
  };

  const renderStep = () => {
    console.log(currentStep);
    
    
    switch (currentStep) {
      case 0:
        return <WelcomeStep onNext={handleNext} />;
      case 1:
        return (
          <PersonalInfoStep
            userData={userData}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onUpdate={updateUserData}
          />
        );
      case 2:
        return (
          <PreferencesStep
            userData={userData}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onUpdate={updateUserData}
          />
        );
      case 3:
        return (
          <CompletionStep
            userData={userData}
            onPrevious={handlePrevious}
            onComplete={onComplete}
          />
        );
      default:
        return <WelcomeStep onNext={handleNext} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {currentStep > 0 && (
          <View style={styles.progressContainer}>
            <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />
          </View>
        )}
        <View style={styles.stepContainer}>
          <View style={styles.stepContent}>
            {renderStep()}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
  },
  progressContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  stepContent: {
    width: '100%',
    maxWidth: 400, // Similar to max-w-md in Tailwind
  },
});