import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Search, SlidersHorizontal } from 'lucide-react-native';
import { useMentors } from '../../../src/features/Mentors/api/hooks';
import { MentorCard } from '../../../src/features/Mentors/components/mentor-card';
import { useFilterStore } from '../../../src/store/filters';
import type { MentorListParams } from '../../../src/lib/types';

const CATEGORIES = ['Всички', 'Frontend', 'Backend', 'Data Science', 'Design', 'Mobile'];

export default function BrowseScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { filters, setFilters } = useFilterStore();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Всички');

  const queryParams: MentorListParams = {
    ...filters,
    q: search || undefined,
    topic: activeCategory !== 'Всички' ? activeCategory : undefined,
  };

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useMentors(queryParams);
  const mentors = data?.pages.flat() ?? [];

  const HEADER_HEIGHT = insets.top + 58 + 52 + 40;
  const TAB_BAR_HEIGHT = 49 + (insets.bottom > 0 ? insets.bottom : 8);

  return (
    <View className="flex-1 bg-cream">
      {/* Sticky header */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, paddingTop: insets.top, paddingHorizontal: 20, paddingBottom: 12, backgroundColor: '#FAF7F2' }}>
        <View className="flex-row items-center justify-between">
          <Text style={{ fontSize: 26, letterSpacing: 1, color: '#1B1B43' }}>{t('mentee.browse.title')}</Text>
          <TouchableOpacity className="w-9 h-9 rounded-full bg-white border border-line items-center justify-center">
            <Text className="text-[11px] font-semibold text-ink">BG</Text>
          </TouchableOpacity>
        </View>
        <View className="relative mt-3">
          <Search size={16} color="rgba(27,27,67,0.4)" style={{ position: 'absolute', left: 12, top: 10, zIndex: 1 }} />
          <TextInput
            className="w-full pl-10 pr-20 py-2.5 rounded-2xl border border-line-strong bg-white text-[13.5px] text-ink"
            placeholder={t('mentee.browse.search_placeholder')}
            value={search}
            onChangeText={setSearch}
          />
          <TouchableOpacity className="absolute right-2 top-1.5 px-2.5 py-1.5 rounded-full bg-purple-deep flex-row items-center gap-1">
            <SlidersHorizontal size={11} color="white" />
            <Text className="text-[11px] font-semibold text-white">{t('mentee.browse.filter')}</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item}
          contentContainerStyle={{ gap: 6, marginTop: 8 }}
          renderItem={({ item }) => {
            const active = item === activeCategory;
            return (
              <TouchableOpacity
                onPress={() => setActiveCategory(item)}
                style={{
                  paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
                  borderWidth: 1,
                  backgroundColor: active ? '#3E1D87' : 'white',
                  borderColor: active ? '#3E1D87' : '#DAD6CC',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '500', color: active ? 'white' : 'rgba(27,27,67,0.7)' }}>{item}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      <FlatList
        data={mentors}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: HEADER_HEIGHT + 8, paddingBottom: TAB_BAR_HEIGHT + 8, paddingHorizontal: 20 }}
        renderItem={({ item }) => <MentorCard mentor={item} />}
        onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <Text className="text-[12.5px] text-ink/55 mb-2">
            <Text className="text-ink font-semibold">{mentors.length}</Text> {t('mentee.browse.sorted_by')}
          </Text>
        }
        ListEmptyComponent={
          isLoading ? (
            <View className="items-center mt-10">
              <ActivityIndicator color="#3E1D87" />
              <Text className="text-[12px] text-ink/55 mt-2">{t('mentee.browse.loading')}</Text>
            </View>
          ) : null
        }
        ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color="#3E1D87" style={{ marginVertical: 16 }} /> : null}
      />
    </View>
  );
}
