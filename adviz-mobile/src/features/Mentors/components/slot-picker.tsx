import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useMentorAvailability } from '../api/hooks';
import type { SlotRead } from '../../../lib/types';

const DAY_ABBR = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

function getWeekDays(from: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(from);
    d.setDate(from.getDate() + i);
    return d;
  });
}

function groupSlotsByDay(slots: SlotRead[]): Record<string, SlotRead[]> {
  return slots.reduce<Record<string, SlotRead[]>>((acc, slot) => {
    const day = slot.start.slice(0, 10);
    if (!acc[day]) acc[day] = [];
    acc[day].push(slot);
    return acc;
  }, {});
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit', hour12: false });
}

interface SlotPickerProps {
  mentorId: string;
  onSelect: (slot: SlotRead) => void;
  selectedSlot: SlotRead | null;
}

export function SlotPicker({ mentorId, onSelect, selectedSlot }: SlotPickerProps) {
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const { data: slots = [] } = useMentorAvailability(
    mentorId,
    weekStart.toISOString(),
    weekEnd.toISOString(),
  );

  const { t } = useTranslation();
  const autoSelectedRef = useRef(false);

  const slotsByDay = groupSlotsByDay(slots);
  const days = getWeekDays(weekStart);
  const tzOffset = -new Date().getTimezoneOffset() / 60;
  const tzLabel = `UTC${tzOffset >= 0 ? '+' : ''}${tzOffset}`;

  useEffect(() => {
    if (autoSelectedRef.current || !slots.length) return;
    autoSelectedRef.current = true;
    const grouped = groupSlotsByDay(slots);
    const firstDay = Object.keys(grouped).sort()[0];
    if (!firstDay) return;
    setSelectedDay(firstDay);
    const firstSlot = grouped[firstDay][0];
    if (firstSlot) onSelect(firstSlot);
  }, [slots, onSelect]);

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Month nav */}
      <View className="flex-row items-center justify-between">
        <Text className="text-[14px] font-semibold text-ink">
          {weekStart.toLocaleDateString('bg-BG', { month: 'long', year: 'numeric' })}
        </Text>
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); }}
            className="w-8 h-8 rounded-full bg-white border border-line items-center justify-center"
          ><Text className="text-ink">‹</Text></TouchableOpacity>
          <TouchableOpacity
            onPress={() => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); }}
            className="w-8 h-8 rounded-full bg-white border border-line items-center justify-center"
          ><Text className="text-ink">›</Text></TouchableOpacity>
        </View>
      </View>

      {/* 7-day grid */}
      <View className="flex-row gap-1 mt-3">
        {days.map((day) => {
          const key = day.toISOString().slice(0, 10);
          const isSelected = selectedDay === key;
          const hasSlots = !!slotsByDay[key]?.length;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => { if (hasSlots) setSelectedDay(key); }}
              disabled={!hasSlots}
              style={{ flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 12, backgroundColor: isSelected ? '#3E1D87' : '#FFFFFF', borderWidth: 1, borderColor: isSelected ? '#3E1D87' : '#ECE9E2', opacity: hasSlots ? 1 : 0.4 }}
            >
              <Text style={{ fontSize: 10, fontWeight: '600', textTransform: 'uppercase', color: isSelected ? 'rgba(255,255,255,0.7)' : 'rgba(27,27,67,0.5)' }}>{DAY_ABBR[day.getDay() === 0 ? 6 : day.getDay() - 1]}</Text>
              <Text style={{ fontSize: 15, fontWeight: '600', color: isSelected ? 'white' : '#1B1B43' }}>{day.getDate()}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Slots for selected day */}
      {selectedDay && (
        <>
          <Text className="text-[12.5px] font-semibold text-ink/65 mt-4 mb-2">{t('mentee.booking.available_slots')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {(slotsByDay[selectedDay] ?? []).map((slot) => {
              const isSelected = selectedSlot?.start === slot.start;
              return (
                <TouchableOpacity
                  key={`${slot.start}-${slot.end}`}
                  onPress={() => onSelect(slot)}
                  style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, backgroundColor: isSelected ? '#3E1D87' : 'white', borderColor: isSelected ? '#3E1D87' : '#DAD6CC', width: '30%' }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', textAlign: 'center', color: isSelected ? 'white' : '#1B1B43' }}>{formatTime(slot.start)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}

      {/* Timezone notice */}
      <View className="mt-4 flex-row items-center gap-2 px-3 py-2.5 rounded-xl bg-purple-100/60">
        <Text className="text-[11.5px] text-purple-deep font-medium">{t('mentee.booking.slot_timezone', { tz: tzLabel })}</Text>
      </View>
    </ScrollView>
  );
}
