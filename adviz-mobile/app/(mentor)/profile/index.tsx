import { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Modal, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useNavigation } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Eye } from 'lucide-react-native';
import { AppHeader } from '../../../src/components/ui/AppHeader';
import { MCard } from '../../../src/components/ui/MCard';
import { Eyebrow } from '../../../src/components/ui/Eyebrow';
import { TopicChip } from '../../../src/components/ui/TopicChip';
import { CTA } from '../../../src/components/ui/CTA';
import { MAvatar } from '../../../src/components/ui/MAvatar';
import { useMentorMe, useUpdateMentorMe } from '../../../src/features/Mentors/api/hooks';
import { useToast } from '../../../src/components/ui/ToastProvider';

const AVAILABLE_TOPICS = ['React', 'Node.js', 'TypeScript', 'Python', 'Java', 'Go', 'Swift', 'Kotlin', 'Design', 'Data Science', 'DevOps', 'Mobile'];
const AVAILABLE_LANGS = ['🇧🇬 Български', '🇬🇧 English', '🇩🇪 Deutsch', '🇫🇷 Français'];

export default function MentorProfileScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { show } = useToast();
  const { data: profile } = useMentorMe();
  const update = useUpdateMentorMe();
  const navigation = useNavigation();

  const [headline, setHeadline] = useState('');
  const [about, setAbout] = useState('');
  const [topics, setTopics] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [price, setPrice] = useState('');
  const [visible, setVisible] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [showUnsaved, setShowUnsaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setHeadline(profile.headline);
      setAbout(profile.about);
      setTopics(profile.topics as string[]);
      setLanguages(profile.languages as string[]);
      setPrice(profile.hourly_price_eur);
      setVisible(true);
    }
  }, [profile]);

  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e) => {
      if (!isDirty) return;
      e.preventDefault();
      setShowUnsaved(true);
    });
    return unsub;
  }, [navigation, isDirty]);

  function markDirty() { setIsDirty(true); }

  async function handleSave() {
    await update.mutateAsync({ headline, about, topics, languages, hourly_price_eur: price });
    setIsDirty(false);
    show({ tone: 'success', title: 'Профилът е запазен' });
  }

  const earn = price ? (parseFloat(price) * 0.9).toFixed(2) : '—';
  const TAB_HEIGHT = 49 + (insets.bottom > 0 ? insets.bottom : 8);

  return (
    <View className="flex-1 bg-cream">
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, paddingTop: insets.top, paddingHorizontal: 20, backgroundColor: '#FAF7F2' }}>
        <View className="flex-row items-center justify-between py-3">
          <Text style={{ fontFamily: 'InriaSans_400Regular', fontSize: 24, letterSpacing: 0.5, color: '#1B1B43' }}>{t('mentor.profile.title')}</Text>
          <TouchableOpacity onPress={handleSave} disabled={update.isPending || !isDirty} className={`px-3 py-1.5 rounded-full ${isDirty ? 'bg-purple-deep' : 'bg-line'}`}>
            <Text className={`text-[11.5px] font-semibold ${isDirty ? 'text-white' : 'text-ink/45'}`}>{t('mentor.profile.save')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 58 + 16, paddingBottom: TAB_HEIGHT + 8, paddingHorizontal: 20 }}>
        {/* Live preview */}
        <MCard className="mt-2 p-3.5 flex-row items-start gap-3" style={{ backgroundColor: '#FE5B52', borderColor: 'transparent' }}>
          <MAvatar initials={headline.slice(0, 2).toUpperCase() || 'МП'} color="rgba(255,255,255,0.3)" size={48} ring />
          <View className="flex-1">
            <Text className="text-[10.5px] uppercase tracking-wider font-semibold text-white/75">{t('mentor.profile.live_preview')}</Text>
            <Text className="text-[14px] font-semibold text-white mt-0.5">{profile?.full_name ?? 'Твоето Име'}</Text>
            <Text className="text-[11.5px] text-white/80">{headline || profile?.headline}</Text>
          </View>
        </MCard>

        {/* Headline */}
        <Eyebrow className="mt-4">{t('mentor.profile.headline')}</Eyebrow>
        <TextInput
          className="mt-1.5 w-full px-3.5 py-3 rounded-xl border border-line-strong bg-white text-[13px] text-ink"
          value={headline}
          onChangeText={(v) => { setHeadline(v); markDirty(); }}
          maxLength={120}
          placeholder="Senior Engineer @ Google"
        />

        {/* About */}
        <Eyebrow className="mt-3">{t('mentor.profile.about')}</Eyebrow>
        <TextInput
          className="mt-1.5 w-full px-3.5 py-3 rounded-xl border border-line-strong bg-white text-[13px] text-ink"
          value={about}
          onChangeText={(v) => { setAbout(v); markDirty(); }}
          multiline
          numberOfLines={4}
          style={{ textAlignVertical: 'top' }}
          maxLength={1000}
        />
        <Text className="text-[10.5px] text-ink/45 text-right mt-0.5">{about.length}/1000</Text>

        {/* Topics */}
        <Eyebrow className="mt-2">{t('mentor.profile.topics')}</Eyebrow>
        <View className="flex-row flex-wrap gap-1.5 mt-2">
          {AVAILABLE_TOPICS.map((t_) => (
            <TopicChip
              key={t_}
              label={t_}
              active={topics.includes(t_)}
              onPress={() => {
                setTopics((prev) => prev.includes(t_) ? prev.filter((x) => x !== t_) : prev.length < 5 ? [...prev, t_] : prev);
                markDirty();
              }}
            />
          ))}
        </View>

        {/* Languages */}
        <Eyebrow className="mt-3">{t('mentor.profile.languages')}</Eyebrow>
        <View className="flex-row flex-wrap gap-1.5 mt-2">
          {AVAILABLE_LANGS.map((l) => (
            <TopicChip
              key={l}
              label={l}
              active={languages.includes(l)}
              onPress={() => { setLanguages((prev) => prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]); markDirty(); }}
            />
          ))}
        </View>

        {/* Price */}
        <Eyebrow className="mt-3">{t('mentor.profile.price')}</Eyebrow>
        <View className="flex-row gap-2 mt-1.5">
          <TextInput
            className="flex-1 px-3.5 py-3 rounded-xl bg-white border border-line-strong text-[13.5px] font-semibold text-ink"
            value={price}
            onChangeText={(v) => { setPrice(v); markDirty(); }}
            keyboardType="decimal-pad"
            placeholder="50.00"
          />
          <View className="flex-1 px-3.5 py-3 rounded-xl bg-emerald-100/50 items-start justify-center">
            <Text className="text-[11px] text-emerald-700">{t('mentor.profile.you_earn')}</Text>
            <Text className="text-[13.5px] font-semibold text-emerald-700">€{earn}</Text>
          </View>
        </View>
        <Text className="text-[10.5px] text-ink/45 mt-1">{t('mentor.profile.fee_note')}</Text>

        {/* Visibility */}
        <MCard className="mt-4 p-3.5 flex-row items-center gap-3">
          <View className="w-9 h-9 rounded-xl bg-purple-100 items-center justify-center">
            <Eye size={16} color="#3E1D87" />
          </View>
          <Text className="flex-1 text-[13px] font-medium text-ink">{t('mentor.profile.visibility')}</Text>
          <Switch value={visible} onValueChange={(v) => { setVisible(v); markDirty(); }} trackColor={{ false: '#DAD6CC', true: '#3E1D87' }} thumbColor="white" />
        </MCard>

        {/* Switch to mentee */}
        <TouchableOpacity onPress={() => router.replace('/(mentee)/browse')} className="mt-3 w-full py-3 rounded-2xl bg-white border border-line-strong flex-row items-center justify-center gap-2">
          <Text className="text-[13px] font-semibold text-ink">{t('mentor.profile.switch_mentee')}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Unsaved changes modal */}
      <Modal transparent visible={showUnsaved} animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,10,50,0.55)' }}>
          <View className="bg-white rounded-t-[28px] pb-9 pt-4 px-5">
            <View className="w-9 h-1 rounded-full bg-line-strong self-center mb-4" />
            <Text className="text-[19px] font-semibold text-ink text-center">{t('mentor.profile.unsaved_title')}</Text>
            <CTA label={t('mentor.profile.unsaved_save')} onPress={() => { handleSave(); setShowUnsaved(false); }} className="mt-4" />
            <TouchableOpacity onPress={() => setShowUnsaved(false)} className="mt-2 py-3 items-center">
              <Text className="text-[13px] font-semibold text-ink">{t('mentor.profile.unsaved_keep')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setIsDirty(false); setShowUnsaved(false); router.back(); }} className="mt-1 py-3 items-center">
              <Text className="text-[13px] font-semibold text-coral">{t('mentor.profile.unsaved_discard')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
