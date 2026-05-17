import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Settings, Globe, HelpCircle, FileText } from 'lucide-react-native';
import { MCard } from '../../../src/components/ui/MCard';
import { MAvatar } from '../../../src/components/ui/MAvatar';
import { useAuthStore } from '../../../src/store/auth';
import { isMentor } from '../../../src/lib/scopes';

export default function MenteeProfileScreen() {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const { user, scopes, clearAuth } = useAuthStore();

  if (!user) return null;

  const isM = isMentor(scopes);
  const TAB_HEIGHT = 49 + (insets.bottom > 0 ? insets.bottom : 8);

  function toggleLang() {
    i18n.changeLanguage(i18n.language === 'bg' ? 'en' : 'bg');
  }

  return (
    <View className="flex-1 bg-cream">
      <View style={{ paddingTop: insets.top, paddingHorizontal: 20, paddingBottom: 12 }}>
        <View className="flex-row items-center justify-between">
          <Text style={{ fontSize: 22, letterSpacing: 0.5, color: '#1B1B43' }}>{t('mentee.profile.title')}</Text>
          <TouchableOpacity className="w-9 h-9 rounded-full bg-white border border-line items-center justify-center">
            <Settings size={16} color="#1B1B43" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingTop: 8, paddingBottom: TAB_HEIGHT + 8, paddingHorizontal: 20 }}>
        {/* User card */}
        <MCard className="p-4 flex-row items-center gap-3 mt-2">
          <MAvatar initials={user.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2)} color="#CBCBFF" size={56} />
          <View className="flex-1">
            <Text className="text-[15px] font-semibold text-ink">{user.full_name}</Text>
            <Text className="text-[12px] text-ink/55">{user.email}</Text>
          </View>
          <TouchableOpacity><Text className="text-[11.5px] font-semibold text-purple-deep">{t('mentee.profile.edit')}</Text></TouchableOpacity>
        </MCard>

        {/* Become mentor card */}
        {!isM && (
          <MCard className="mt-3 p-4" style={{ backgroundColor: '#3E1D87', borderColor: 'transparent' }}>
            <View className="w-10 h-10 rounded-2xl items-center justify-center mb-2" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
              <Text style={{ fontSize: 20 }}>🎓</Text>
            </View>
            <Text className="text-[14px] font-semibold text-white">{t('mentee.profile.become_mentor')}</Text>
            <Text className="text-[11.5px] mt-0.5" style={{ color: 'rgba(255,255,255,0.7)' }}>{t('mentee.profile.become_mentor_sub')}</Text>
          </MCard>
        )}

        {/* Settings rows */}
        {[
          { icon: Globe, label: t('mentee.profile.language'), hint: i18n.language.toUpperCase(), onPress: toggleLang },
          { icon: HelpCircle, label: 'Помощ', onPress: () => {} },
          { icon: FileText, label: 'Условия за ползване', onPress: () => {} },
        ].map((row) => (
          <TouchableOpacity key={row.label} onPress={row.onPress} className="bg-white border border-line rounded-2xl p-3 flex-row items-center gap-3 mt-2">
            <View className="w-8 h-8 rounded-lg bg-purple-100 items-center justify-center">
              <row.icon size={16} color="#3E1D87" />
            </View>
            <Text className="flex-1 text-[13.5px] font-medium text-ink">{row.label}</Text>
            {row.hint && <Text className="text-[11.5px] text-ink/55 mr-1">{row.hint}</Text>}
            <ChevronRight size={16} color="rgba(27,27,67,0.35)" />
          </TouchableOpacity>
        ))}

        {isM && (
          <TouchableOpacity
            onPress={() => router.replace('/(mentor)/dashboard' as never)}
            className="mt-2 w-full py-3 rounded-2xl bg-white border border-line-strong flex-row items-center justify-center gap-2"
          >
            <Text className="text-[13px] font-semibold text-ink">{t('mentee.profile.switch_mentor')}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => { clearAuth(); router.replace('/(auth)/login' as never); }}
          className="mt-2 w-full py-3 rounded-2xl bg-white border border-line-strong items-center"
        >
          <Text className="text-coral font-semibold text-[13.5px]">{t('mentee.profile.sign_out')}</Text>
        </TouchableOpacity>

        <Text className="text-[10.5px] text-ink/35 text-center mt-4">v1.0.0</Text>
      </ScrollView>
    </View>
  );
}
