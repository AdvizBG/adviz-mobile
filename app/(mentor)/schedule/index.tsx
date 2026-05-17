import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Trash2, Plus } from 'lucide-react-native';
import { MCard } from '../../../src/components/ui/MCard';
import { UnderlineTabs } from '../../../src/components/ui/UnderlineTabs';
import { useToast } from '../../../src/components/ui/ToastProvider';
import { useSchedule, useSaveSchedule } from '../../../src/features/Mentors/api/hooks';
import { detectOverlaps } from '../../../src/features/MentorSchedule/schemas/schedule';
import type { AvailabilityTemplateRead, ScheduleRead } from '../../../src/lib/types';

function hmToDate(hm: string): Date {
  const [h, m] = hm.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function dateToHm(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

type ScheduleTab = 'template' | 'overrides' | 'blocked' | 'settings';
const DAY_NAMES = ['Понеделник', 'Вторник', 'Сряда', 'Четвъртък', 'Петък', 'Събота', 'Неделя'];
const DAY_ABBR = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

interface DayTemplate {
  weekday: number;
  enabled: boolean;
  timezone: string;
  ranges: { start_time: string; end_time: string }[];
}

function buildDayTemplates(templates: AvailabilityTemplateRead[]): DayTemplate[] {
  return Array.from({ length: 7 }, (_, weekday) => {
    const daySlots = templates.filter((t) => t.weekday === weekday);
    return {
      weekday,
      enabled: daySlots.length > 0,
      timezone: daySlots[0]?.timezone ?? 'Europe/Sofia',
      ranges: daySlots.length > 0
        ? daySlots.map((t) => ({ start_time: t.start_time.slice(0, 5), end_time: t.end_time.slice(0, 5) }))
        : [{ start_time: '09:00', end_time: '17:00' }],
    };
  });
}

export default function MentorScheduleScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { show } = useToast();
  const { data: schedule } = useSchedule();
  const save = useSaveSchedule();
  const [tab, setTab] = useState<ScheduleTab>('template');
  const [days, setDays] = useState<DayTemplate[]>(buildDayTemplates([]));
  const [settings, setSettings] = useState({ length_minutes: 60, buffer_minutes: 15, min_notice_hours: 24, max_per_day: 4, visibility: 'public' as const });

  useEffect(() => {
    if (schedule) {
      setDays(buildDayTemplates(schedule.templates));
      if (schedule.session_settings) setSettings(schedule.session_settings);
    }
  }, [schedule]);

  const overlapErrors: Record<number, string> = {};
  days.forEach((day) => {
    if (day.enabled) {
      const overlap = detectOverlaps(day.ranges);
      if (overlap) overlapErrors[day.weekday] = overlap;
    }
  });
  const hasErrors = Object.keys(overlapErrors).length > 0;

  async function handleSave() {
    if (hasErrors) return;
    const templates = days.flatMap((day) =>
      day.enabled
        ? day.ranges.map((r) => ({ weekday: day.weekday, start_time: r.start_time + ':00', end_time: r.end_time + ':00', timezone: day.timezone }))
        : []
    );
    await save.mutateAsync({ templates, session_settings: settings });
    show({ tone: 'success', title: t('mentor.schedule.saved') });
  }

  function updateRange(weekday: number, idx: number, field: 'start_time' | 'end_time', value: string) {
    setDays((prev) => prev.map((d) =>
      d.weekday === weekday
        ? { ...d, ranges: d.ranges.map((r, i) => i === idx ? { ...r, [field]: value } : r) }
        : d
    ));
  }

  function addRange(weekday: number) {
    setDays((prev) => prev.map((d) =>
      d.weekday === weekday ? { ...d, ranges: [...d.ranges, { start_time: '09:00', end_time: '17:00' }] } : d
    ));
  }

  function removeRange(weekday: number, idx: number) {
    setDays((prev) => prev.map((d) =>
      d.weekday === weekday ? { ...d, ranges: d.ranges.filter((_, i) => i !== idx) } : d
    ));
  }

  const HEADER_HEIGHT = insets.top + 58 + 52;
  const TAB_HEIGHT = 49 + (insets.bottom > 0 ? insets.bottom : 8);

  return (
    <View className="flex-1 bg-cream">
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, paddingTop: insets.top, paddingHorizontal: 20, backgroundColor: '#FAF7F2' }}>
        <View className="flex-row items-center justify-between py-3">
          <Text style={{ fontFamily: 'InriaSans_400Regular', fontSize: 24, letterSpacing: 0.5, color: '#1B1B43' }}>{t('mentor.schedule.title')}</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={hasErrors || save.isPending}
            className={`px-3 py-1.5 rounded-full ${hasErrors ? 'bg-coral' : 'bg-purple-deep'}`}
          >
            <Text className="text-white text-[11.5px] font-semibold">
              {hasErrors ? `${Object.keys(overlapErrors).length} ${t('mentor.schedule.save_blocked')}` : t('mentor.schedule.save')}
            </Text>
          </TouchableOpacity>
        </View>
        <UnderlineTabs
          tabs={[
            { key: 'template', label: t('mentor.schedule.tab_template') },
            { key: 'overrides', label: t('mentor.schedule.tab_overrides') },
            { key: 'blocked', label: t('mentor.schedule.tab_blocked') },
            { key: 'settings', label: t('mentor.schedule.tab_settings') },
          ]}
          activeKey={tab}
          onSelect={(k) => setTab(k as ScheduleTab)}
        />
      </View>

      <ScrollView
        style={{ position: 'absolute', top: HEADER_HEIGHT, left: 0, right: 0, bottom: TAB_HEIGHT }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16 }}
      >
        {tab === 'template' && (
          <View className="gap-2">
            {days.map((day) => {
              const overlap = overlapErrors[day.weekday];
              return (
                <View
                  key={day.weekday}
                  className={`rounded-2xl p-3 border ${day.enabled ? (overlap ? 'bg-rose-50 border-2 border-coral' : 'bg-white border-line') : 'bg-cream border-line'}`}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: day.enabled ? '#3E1D87' : '#ECE9E2' }}>
                        <Text style={{ fontSize: 11.5, fontWeight: '600', color: day.enabled ? 'white' : 'rgba(27,27,67,0.45)' }}>{DAY_ABBR[day.weekday]}</Text>
                      </View>
                      <Text className={`text-[13px] font-semibold ${day.enabled ? 'text-ink' : 'text-ink/45'}`}>{DAY_NAMES[day.weekday]}</Text>
                    </View>
                    <Switch
                      value={day.enabled}
                      onValueChange={(v) => setDays((prev) => prev.map((d) => d.weekday === day.weekday ? { ...d, enabled: v } : d))}
                      trackColor={{ false: '#DAD6CC', true: '#3E1D87' }}
                      thumbColor="white"
                    />
                  </View>

                  {day.enabled && (
                    <View className="mt-2 gap-1.5">
                      {day.ranges.map((range, idx) => (
                        <View key={idx} className="flex-row items-center gap-1.5">
                          <DateTimePicker
                            mode="time"
                            is24Hour
                            value={hmToDate(range.start_time)}
                            onChange={(_, d) => d && updateRange(day.weekday, idx, 'start_time', dateToHm(d))}
                          />
                          <Text className="text-ink/40">–</Text>
                          <DateTimePicker
                            mode="time"
                            is24Hour
                            value={hmToDate(range.end_time)}
                            onChange={(_, d) => d && updateRange(day.weekday, idx, 'end_time', dateToHm(d))}
                          />
                          <TouchableOpacity onPress={() => removeRange(day.weekday, idx)} className="w-7 h-7 rounded-lg bg-cream border border-line items-center justify-center">
                            <Trash2 size={14} color="rgba(27,27,67,0.5)" />
                          </TouchableOpacity>
                        </View>
                      ))}
                      {overlap && (
                        <View className="px-2 py-1.5 rounded-lg bg-coral/10">
                          <Text className="text-[11.5px] font-medium text-coral">{t('mentor.schedule.overlap_error', { from: overlap.split('–')[0], to: overlap.split('–')[1] })}</Text>
                        </View>
                      )}
                      <TouchableOpacity onPress={() => addRange(day.weekday)} className="flex-row items-center gap-1 px-2 self-start">
                        <Plus size={12} color="#3E1D87" />
                        <Text className="text-[11px] font-semibold text-purple-deep">{t('mentor.schedule.add_range')}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {tab === 'settings' && (
          <View className="gap-3">
            <View>
              <Text className="text-[12.5px] font-medium text-ink mb-2">{t('mentor.schedule.length_label')}</Text>
              <View className="flex-row gap-1.5">
                {[30, 45, 60, 90].map((mins) => (
                  <TouchableOpacity
                    key={mins}
                    onPress={() => setSettings((s) => ({ ...s, length_minutes: mins }))}
                    className={`flex-1 py-2.5 rounded-xl items-center ${settings.length_minutes === mins ? 'bg-purple-deep' : 'bg-white border border-line-strong'}`}
                  >
                    <Text className={`text-[12px] font-semibold ${settings.length_minutes === mins ? 'text-white' : 'text-ink'}`}>{mins}м</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View>
              <Text className="text-[12.5px] font-medium text-ink mb-2">{t('mentor.schedule.buffer_label')}</Text>
              <View className="flex-row gap-1.5">
                {[0, 10, 15, 30, 60].map((mins) => (
                  <TouchableOpacity
                    key={mins}
                    onPress={() => setSettings((s) => ({ ...s, buffer_minutes: mins }))}
                    className={`flex-1 py-2.5 rounded-xl items-center ${settings.buffer_minutes === mins ? 'bg-purple-deep' : 'bg-white border border-line-strong'}`}
                  >
                    <Text className={`text-[12px] font-semibold ${settings.buffer_minutes === mins ? 'text-white' : 'text-ink'}`}>{mins}м</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <MCard className="p-3.5">
              {[
                { label: t('mentor.schedule.notice_label'), key: 'min_notice_hours' as const, unit: t('common.hours') },
                { label: t('mentor.schedule.max_label'), key: 'max_per_day' as const, unit: 'сесии' },
              ].map((row) => (
                <View key={row.key} className="flex-row items-center justify-between py-1.5">
                  <Text className="text-[12.5px] font-medium text-ink">{row.label}</Text>
                  <View className="flex-row items-center gap-2">
                    <TouchableOpacity
                      onPress={() => setSettings((s) => ({ ...s, [row.key]: Math.max(0, s[row.key] - 1) }))}
                      className="w-7 h-7 rounded-lg bg-cream border border-line items-center justify-center"
                    ><Text className="text-ink font-semibold">−</Text></TouchableOpacity>
                    <Text className="w-12 text-center text-[14px] font-bold text-ink">{settings[row.key]}</Text>
                    <TouchableOpacity
                      onPress={() => setSettings((s) => ({ ...s, [row.key]: s[row.key] + 1 }))}
                      className="w-7 h-7 rounded-lg bg-purple-deep items-center justify-center"
                    ><Text className="text-white font-semibold">+</Text></TouchableOpacity>
                    <Text className="text-[11px] text-ink/55">{row.unit}</Text>
                  </View>
                </View>
              ))}
            </MCard>
            <MCard className="p-3.5 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2.5">
                <View className="w-9 h-9 rounded-xl bg-purple-100 items-center justify-center">
                  <Text>👁</Text>
                </View>
                <View>
                  <Text className="text-[13px] font-medium text-ink">{t('mentor.schedule.visibility_label')}</Text>
                  <Text className="text-[11px] text-ink/55">{t('mentor.schedule.visibility_public')}</Text>
                </View>
              </View>
              <Switch
                value={settings.visibility === 'public'}
                onValueChange={(v) => setSettings((s) => ({ ...s, visibility: v ? 'public' : 'private' }))}
                trackColor={{ false: '#DAD6CC', true: '#3E1D87' }}
                thumbColor="white"
              />
            </MCard>
          </View>
        )}

        {tab === 'overrides' && (
          <View>
            <TouchableOpacity className="border border-dashed border-purple-deep/40 bg-purple-100/30 py-3 rounded-2xl items-center flex-row justify-center gap-2">
              <Plus size={14} color="#3E1D87" />
              <Text className="text-purple-deep text-[12.5px] font-semibold">{t('mentor.schedule.add_override')}</Text>
            </TouchableOpacity>
            <Text className="text-[12px] text-ink/45 text-center mt-8">Няма изключения</Text>
          </View>
        )}

        {tab === 'blocked' && (
          <View>
            <TouchableOpacity className="border border-dashed border-coral/40 bg-coral/5 py-3 rounded-2xl items-center flex-row justify-center gap-2">
              <Plus size={14} color="#FE5B52" />
              <Text className="text-coral text-[12.5px] font-semibold">{t('mentor.schedule.block_dates')}</Text>
            </TouchableOpacity>
            {schedule?.blocks.map((block) => (
              <MCard key={block.id} className="mt-2 p-3 flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-xl bg-coral/10 items-center justify-center">
                  <Text>🚫</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-[13px] font-semibold text-ink">{block.reason ?? 'Блокиран период'}</Text>
                  <Text className="text-[11px] text-ink/55">{new Date(block.start_at).toLocaleDateString('bg-BG')} – {new Date(block.end_at).toLocaleDateString('bg-BG')}</Text>
                </View>
                <TouchableOpacity><Trash2 size={16} color="rgba(27,27,67,0.4)" /></TouchableOpacity>
              </MCard>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
