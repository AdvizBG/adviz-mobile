import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Search, Calendar, User } from 'lucide-react-native';

export default function MenteeLayout() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const tabBarHeight = 49;
  const bottomPadding = insets.bottom > 0 ? insets.bottom : 8;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(255,255,255,0.96)',
          borderTopWidth: 1,
          borderTopColor: '#ECE9E2',
          height: tabBarHeight + bottomPadding,
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
        name="browse"
        options={{
          tabBarLabel: t('mentee.browse.title'),
          tabBarIcon: ({ color }) => <Search size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          tabBarLabel: t('mentee.bookings.title'),
          tabBarIcon: ({ color }) => <Calendar size={22} color={color} />,
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
