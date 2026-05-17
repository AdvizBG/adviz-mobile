import '../global.css';
import '../src/lib/i18n';
import React, { useEffect } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StripeProvider } from '@stripe/stripe-react-native';
import { useAuthStore } from '../src/store/auth';
import { isMentor } from '../src/lib/scopes';
import { QueryProvider } from '../src/lib/query-client';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { token, scopes } = useAuthStore();
  const segments = useSegments();
  const [hydrated, setHydrated] = React.useState(false);

  // Wait for Zustand persist rehydration so the first API request has a token
  React.useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    if (useAuthStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const inAuth = segments[0] === '(auth)';
    const inMentor = segments[0] === '(mentor)';
    const inMentee = segments[0] === '(mentee)';
    const mentorUser = isMentor(scopes);

    if (!token && !inAuth) {
      router.replace('/(auth)/login');
    } else if (token && inAuth) {
      router.replace(mentorUser ? '/(mentor)/dashboard' : '/(mentee)/browse');
    } else if (token && inMentor && !mentorUser) {
      router.replace('/(mentee)/browse');
    } else if (token && inMentee && mentorUser) {
      router.replace('/(mentor)/dashboard');
    }
  }, [token, segments, scopes, hydrated]);

  if (!hydrated) return null;
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_KEY!}>
          <QueryProvider>
            <AuthGuard>
              <Stack screenOptions={{ headerShown: false }} />
            </AuthGuard>
          </QueryProvider>
        </StripeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
