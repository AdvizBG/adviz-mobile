import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Home, Calendar, Video, User } from 'lucide-react-native';

export default function MentorLayout() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const bottomPadding = insets.bottom > 0 ? insets.bottom : 8;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(255,255,255,0.96)',
          borderTopWidth: 1,
          borderTopColor: '#ECE9E2',
          height: 49 + bottomPadding,
          paddingBottom: bottomPadding,
          paddingTop: 8,
          position: 'absolute',
        },
        tabBarActiveTintColor: '#3E1D87',
        tabBarInactiveTintColor: 'rgba(27,27,67,0.45)',
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: '600', letterSpacing: -0.3 },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          tabBarLabel: t('mentor.dashboard.greeting').replace(',', ''),
          tabBarIcon: ({ color }) => <Home size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          tabBarLabel: t('mentor.schedule.title'),
          tabBarIcon: ({ color }) => <Calendar size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="sessions"
        options={{
          tabBarLabel: t('mentor.sessions.title'),
          tabBarIcon: ({ color }) => <Video size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: t('mentee.profile.title'),
          tabBarIcon: ({ color }) => <User size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
