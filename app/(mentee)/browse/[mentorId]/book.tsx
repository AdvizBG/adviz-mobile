import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react-native';
import { AppHeader } from '../../../../src/components/ui/AppHeader';
import { StepDots } from '../../../../src/components/ui/StepDots';
import { CTA } from '../../../../src/components/ui/CTA';
import { MCard } from '../../../../src/components/ui/MCard';
import { Eyebrow } from '../../../../src/components/ui/Eyebrow';
import { SlotPicker } from '../../../../src/features/Mentors/components/slot-picker';
import { useMentor } from '../../../../src/features/Mentors/api/hooks';
import { useCreateSession, useCreatePayment, useSessionPaidStatus } from '../../../../src/features/Sessions/api/hooks';
import { useAuthStore } from '../../../../src/store/auth';
import { useToast } from '../../../../src/components/ui/ToastProvider';
import { useStripe } from '@stripe/stripe-react-native';
import type { SlotRead } from '../../../../src/lib/types';

type Step = 0 | 1 | 2 | 3;

export default function BookScreen() {
  const { mentorId } = useLocalSearchParams<{ mentorId: string }>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { show } = useToast();
  const user = useAuthStore((s) => s.user);
  const { data: mentor } = useMentor(mentorId);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const createSession = useCreateSession();
  const createPayment = useCreatePayment();

  const [step, setStep] = useState<Step>(0);
  const [selectedSlot, setSelectedSlot] = useState<SlotRead | null>(null);
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sheetReady, setSheetReady] = useState(false);
  const [sheetInitError, setSheetInitError] = useState<string | null>(null);
  const [presentLoading, setPresentLoading] = useState(false);
  const [paymentDeclined, setPaymentDeclined] = useState<{ code: string; message: string } | null>(null);
  const [pollEnabled, setPollEnabled] = useState(false);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current); };
  }, []);

  const { data: sessionPaid } = useSessionPaidStatus(sessionId ?? '', pollEnabled);

  useEffect(() => {
    if (sessionPaid?.is_paid && sessionId) {
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
      setPollEnabled(false);
      router.replace(`/(mentee)/bookings/${sessionId}` as never);
    }
  }, [sessionPaid?.is_paid, sessionId]);

  const price = mentor ? parseFloat(mentor.hourly_price_eur) : 0;
  const sessionPrice = Math.round(price * 0.1);

  const CONTENT_TOP = insets.top + 110 + 86;
  const CTA_BOTTOM = insets.bottom + 83 + 60;

  async function handleGoToPayment() {
    if (!selectedSlot || !user || !mentor) return;
    try {
      const session = await createSession.mutateAsync({
        mentor_id: mentor.user_id,
        mentee_id: user.id,
        scheduled_start: selectedSlot.start,
        scheduled_end: selectedSlot.end,
        topic,
        agenda: notes || null,
        price_eur: sessionPrice.toFixed(2),
      });
      setSessionId(session.id);
      setStep(3);
    } catch {
      show({ tone: 'error', title: t('common.error') });
    }
  }

  useEffect(() => {
    if (step !== 3 || !sessionId || !user) return;
    let cancelled = false;
    setSheetReady(false);
    setSheetInitError(null);

    (async () => {
      try {
        const payment = await createPayment.mutateAsync(sessionId);
        if (cancelled) return;

        const { error: initErr } = await initPaymentSheet({
          paymentIntentClientSecret: payment.client_secret,
          merchantDisplayName: 'Adviz',
          defaultBillingDetails: { email: user.email },
        });
        if (cancelled) return;
        if (initErr) {
          setSheetInitError(initErr.message);
        } else {
          setSheetReady(true);
        }
      } catch {
        if (!cancelled) setSheetInitError(t('common.error'));
      }
    })();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, sessionId]);

  async function handlePresent() {
    if (!sheetReady) return;
    setPaymentDeclined(null);
    setPresentLoading(true);
    const { error } = await presentPaymentSheet();
    setPresentLoading(false);

    if (!error) {
      setPollEnabled(true);
      pollTimeoutRef.current = setTimeout(() => {
        setPollEnabled(false);
        show({ tone: 'info', title: t('mentee.booking.payment_processing') });
        router.replace(`/(mentee)/bookings/${sessionId}` as never);
      }, 30_000);
      return;
    }

    if (error.code !== 'Canceled') {
      setPaymentDeclined({ code: error.code, message: error.message });
    }
  }

  async function handleRetry() {
    setPaymentDeclined(null);
    await handlePresent();
  }

  const STEP_TITLES = [
    t('mentee.booking.step_slot'),
    t('mentee.booking.step_agenda'),
    t('mentee.booking.step_review'),
    t('mentee.booking.step_payment'),
  ];

  return (
    <View className="flex-1 bg-cream">
      <AppHeader
        title={t('mentee.booking.title')}
        right={<TouchableOpacity onPress={() => router.back()}><X size={22} color="#1B1B43" /></TouchableOpacity>}
      />

      {/* Step header */}
      <View style={{ position: 'absolute', left: 0, right: 0, top: insets.top + 58, paddingHorizontal: 20 }}>
        <View className="flex-row items-center justify-between">
          <Text className="text-[11px] uppercase tracking-wider text-ink/50 font-semibold">Стъпка {step + 1}/4</Text>
          <StepDots total={4} current={step} />
        </View>
        <Text className="mt-2 text-[20px] font-light tracking-tight text-ink">{STEP_TITLES[step]}</Text>
      </View>

      {/* Step content */}
      <ScrollView
        style={{ position: 'absolute', left: 0, right: 0, top: CONTENT_TOP, bottom: CTA_BOTTOM }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
      >
        {step === 0 && (
          <SlotPicker mentorId={mentorId} selectedSlot={selectedSlot} onSelect={setSelectedSlot} />
        )}

        {step === 1 && (
          <View>
            <View>
              <View className="flex-row justify-between items-center mb-1.5">
                <Text className="text-[12px] font-semibold text-ink">{t('mentee.booking.topic_label')}</Text>
                <Text className="text-[10.5px] text-ink/50">{topic.length}/120</Text>
              </View>
              <TextInput
                className="px-3.5 py-3 rounded-xl bg-white text-[13.5px] text-ink border-2 border-purple-deep"
                placeholder={t('mentee.booking.topic_placeholder')}
                value={topic}
                onChangeText={(v) => setTopic(v.slice(0, 120))}
                multiline
              />
            </View>
            <View className="mt-4">
              <Text className="text-[12px] font-semibold text-ink mb-1.5">{t('mentee.booking.notes_label')}</Text>
              <TextInput
                className="px-3.5 py-3 rounded-xl bg-white text-[13.5px] text-ink border border-line-strong"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={6}
                style={{ textAlignVertical: 'top' }}
              />
            </View>
            <MCard className="mt-4 p-3.5 flex-row gap-2.5 bg-cream border-line">
              <View className="flex-1">
                <Text className="text-[12px] text-ink/70">Детайлното описание помага на ментора да се подготви по-добре за сесията.</Text>
              </View>
            </MCard>
          </View>
        )}

        {step === 2 && mentor && selectedSlot && (
          <View>
            <MCard className="p-4">
              <View className="flex-row items-center gap-3">
                <View className="w-12 h-12 rounded-full bg-purple-200 items-center justify-center">
                  <Text className="font-semibold text-ink">{(mentor.full_name || 'M').split(' ').map((n) => n[0]).join('').slice(0, 2)}</Text>
                </View>
                <View>
                  <Text className="text-[14px] font-semibold text-ink">{mentor.full_name || 'Mentor'}</Text>
                  <Text className="text-[11.5px] text-ink/60">{mentor.headline}</Text>
                </View>
              </View>
              <View className="flex-row gap-2 mt-3">
                <View className="flex-1 rounded-xl bg-cream p-2.5">
                  <Text className="text-[10px] uppercase tracking-wider text-ink/45 font-semibold">Дата</Text>
                  <Text className="text-[12.5px] font-semibold text-ink mt-0.5">
                    {new Date(selectedSlot.start).toLocaleDateString('bg-BG', { day: 'numeric', month: 'long' })}
                  </Text>
                </View>
                <View className="flex-1 rounded-xl bg-cream p-2.5">
                  <Text className="text-[10px] uppercase tracking-wider text-ink/45 font-semibold">Час</Text>
                  <Text className="text-[12.5px] font-semibold text-ink mt-0.5">
                    {new Date(selectedSlot.start).toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            </MCard>
            <MCard className="mt-3 p-4">
              <Eyebrow>Тема</Eyebrow>
              <Text className="text-[14px] font-semibold text-ink mt-1">{topic}</Text>
              {notes && <Text className="text-[12.5px] text-ink/60 mt-1" numberOfLines={2}>{notes}</Text>}
              <TouchableOpacity onPress={() => setStep(1)}><Text className="text-[12px] font-semibold text-purple-deep mt-2">Редактирай</Text></TouchableOpacity>
            </MCard>
            <MCard className="mt-3 p-4">
              <Eyebrow>Цена</Eyebrow>
              <View className="flex-row justify-between mt-2">
                <Text className="text-[13px] text-ink/70 font-semibold">Сесия</Text>
                <Text className="text-[13px] text-ink/70">€{price.toFixed(2)}</Text>
              </View>
              <View className="flex-row justify-between mt-1">
                <Text className="text-[13px] text-emerald-700 font-semibold">Отстъпка 90%</Text>
                <Text className="text-[13px] text-emerald-700">−€{(price - sessionPrice).toFixed(2)}</Text>
              </View>
              <View className="h-px bg-line my-2" />
              <View className="flex-row justify-between">
                <Text className="text-[14px] font-semibold text-ink">Общо</Text>
                <Text className="text-[18px] font-bold text-ink">€{sessionPrice.toFixed(2)}</Text>
              </View>
            </MCard>
          </View>
        )}

        {step === 3 && (
          <View>
            {paymentDeclined && (
              <MCard className="p-4 bg-rose-50 border-rose-200 mb-4">
                <Text className="text-[14px] font-semibold text-coral">{t('mentee.booking.card_declined')}</Text>
                <Text className="text-[12px] text-coral/80 mt-1">{paymentDeclined.message}</Text>
                <Text className="font-mono text-[10.5px] text-coral/60 mt-1">stripe_error: {paymentDeclined.code}</Text>
              </MCard>
            )}
            {sheetInitError && (
              <MCard className="p-4 bg-rose-50 border-rose-200 mb-4">
                <Text className="text-[13px] text-coral">{sheetInitError}</Text>
              </MCard>
            )}
            <View className="flex-row items-center justify-between p-3 rounded-xl bg-white border border-line mt-2">
              <Text className="text-[11.5px] text-ink/65">🛡 {t('mentee.booking.payment_secured')}</Text>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#635BFF' }}>stripe</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* CTA bar */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 12, paddingBottom: insets.bottom + 16, backgroundColor: '#FAF7F2', borderTopWidth: 1, borderTopColor: '#ECE9E2' }}>
        {step === 0 && (
          <>
            {selectedSlot && <Text className="text-[11.5px] text-ink/55 mb-2 text-center">{new Date(selectedSlot.start).toLocaleString('bg-BG')}</Text>}
            <CTA label={t('mentee.booking.continue')} onPress={() => setStep(1)} disabled={!selectedSlot} />
          </>
        )}
        {step === 1 && (
          <View className="flex-row gap-2">
            <TouchableOpacity onPress={() => setStep(0)} className="px-4 py-3.5 rounded-2xl border border-line-strong items-center justify-center">
              <Text className="font-semibold text-ink text-[14px]">{t('mentee.booking.back')}</Text>
            </TouchableOpacity>
            <CTA label={t('mentee.booking.continue')} onPress={() => setStep(2)} disabled={!topic.trim()} style={{ flex: 1 }} />
          </View>
        )}
        {step === 2 && (
          <View className="flex-row gap-2">
            <TouchableOpacity onPress={() => setStep(1)} className="px-4 py-3.5 rounded-2xl border border-line-strong items-center justify-center">
              <Text className="font-semibold text-ink text-[14px]">{t('mentee.booking.back')}</Text>
            </TouchableOpacity>
            <CTA
              label={t('mentee.booking.pay_cta', { amount: sessionPrice.toFixed(2) })}
              onPress={handleGoToPayment}
              loading={createSession.isPending}
              style={{ flex: 1 }}
            />
          </View>
        )}
        {step === 3 && (
          !sheetReady && !sheetInitError ? (
            <View className="items-center py-3">
              <ActivityIndicator color="#3E1D87" />
            </View>
          ) : (
            <CTA
              label={paymentDeclined
                ? t('mentee.booking.retry_cta', { amount: sessionPrice.toFixed(2) })
                : t('mentee.booking.pay_cta', { amount: sessionPrice.toFixed(2) })}
              onPress={paymentDeclined ? handleRetry : handlePresent}
              loading={presentLoading}
              disabled={!!sheetInitError}
            />
          )
        )}
      </View>
    </View>
  );
}
