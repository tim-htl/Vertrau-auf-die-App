import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  istOnboardingAbgeschlossen,
  markiereOnboardingAbgeschlossen,
} from "./onboarding";

// Globaler Onboarding-Status. Entscheidet zusammen mit der Session im
// RootNavigator, ob der Onboarding-Wizard oder die Tabs gezeigt werden.
// `loading` verhindert ein kurzes Aufblitzen des falschen Bereichs, solange
// das Flag noch aus dem Storage geladen wird.

type OnboardingState = {
  onboardingDone: boolean;
  loading: boolean;
  // Vom letzten Wizard-Schritt aufgerufen → Guard wechselt zu den Tabs.
  abschliessen: () => Promise<void>;
};

const OnboardingContext = createContext<OnboardingState>({
  onboardingDone: false,
  loading: true,
  abschliessen: async () => {},
});

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let aktiv = true;
    istOnboardingAbgeschlossen().then((done) => {
      if (!aktiv) return;
      setOnboardingDone(done);
      setLoading(false);
    });
    return () => {
      aktiv = false;
    };
  }, []);

  async function abschliessen() {
    await markiereOnboardingAbgeschlossen();
    setOnboardingDone(true);
  }

  return (
    <OnboardingContext.Provider value={{ onboardingDone, loading, abschliessen }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingState {
  return useContext(OnboardingContext);
}
