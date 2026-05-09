import { useState, useCallback } from 'react';
import { DEMO_STEPS } from '../data/mockFarmProfiles';

export function useDemoMode() {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const step = isDemoMode ? DEMO_STEPS[currentStep] : null;

  const startDemo = useCallback(() => {
    setIsDemoMode(true);
    setCurrentStep(0);
  }, []);

  const exitDemo = useCallback(() => {
    setIsDemoMode(false);
    setCurrentStep(0);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, DEMO_STEPS.length - 1));
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToStep = useCallback((idx) => {
    setCurrentStep(Math.max(0, Math.min(idx, DEMO_STEPS.length - 1)));
  }, []);

  return {
    isDemoMode,
    currentStep,
    totalSteps: DEMO_STEPS.length,
    step,
    startDemo,
    exitDemo,
    nextStep,
    prevStep,
    goToStep,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === DEMO_STEPS.length - 1,
  };
}
