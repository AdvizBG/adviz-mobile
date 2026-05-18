import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { CTA } from '../../../components/ui/CTA';
import { MCard } from '../../../components/ui/MCard';
import { useCancelSession } from '../api/hooks';
import { useToast } from '../../../components/ui/ToastProvider';
import { useTranslation } from 'react-i18next';
import type { SessionRead } from '../../../lib/types';

interface CancelSheetProps {
  session: SessionRead;
  visible: boolean;
  onDismiss: () => void;
}

export function CancelSheet({ session, visible, onDismiss }: CancelSheetProps) {
  const { t } = useTranslation();
  const { show } = useToast();
  const cancel = useCancelSession();

  const price = parseFloat(session.price_eur) || 0;
  const hoursUntil = (new Date(session.scheduled_start).getTime() - Date.now()) / 3_600_000;
  const isAlreadyStarted = hoursUntil <= 0;
  const isLate = hoursUntil < 24;
  const refund = isLate ? price * 0.5 : price;
  const fee = isLate ? price * 0.5 : 0;

  async function handleCancel() {
    try {
      await cancel.mutateAsync({ sessionId: session.id, body: {} });
      onDismiss();
      show({
        tone: 'success',
        title: t('mentee.bookings.cancelled_toast'),
        body: t('mentee.bookings.refund_timeline', { amount: refund.toFixed(2) }),
      });
    } catch {
      show({ tone: 'error', title: t('common.error') });
    }
  }

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onDismiss}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,10,50,0.55)' }}>
        <View className="bg-white rounded-t-[28px] pb-9 pt-4 px-5">
          <View className="w-9 h-1 rounded-full bg-line-strong self-center mb-4" />
          <View className="w-14 h-14 rounded-2xl bg-amber-100 items-center justify-center self-center">
            <Text style={{ fontSize: 28 }}>⚠️</Text>
          </View>
          {isAlreadyStarted ? (
            <Text className="text-[19px] font-semibold text-ink text-center mt-3">
              {t('mentee.bookings.cannot_cancel_started')}
            </Text>
          ) : (
            <Text className="text-[19px] font-semibold text-ink text-center mt-3">
              {t('mentee.bookings.cancel_title', { hours: Math.floor(Math.max(0, hoursUntil)) })}
            </Text>
          )}
          <MCard className="mt-3 p-4 bg-cream border-line">
            <View className="flex-row justify-between">
              <Text className="text-[12px] text-ink/70">Платено</Text>
              <Text className="text-[12px] text-ink">€{price.toFixed(2)}</Text>
            </View>
            {isLate && (
              <View className="flex-row justify-between mt-1">
                <Text className="text-[12px] text-amber-700 font-semibold">Такса за късна отмяна (50%)</Text>
                <Text className="text-[12px] text-amber-700">−€{fee.toFixed(2)}</Text>
              </View>
            )}
            <View className="h-px bg-line my-2" />
            <View className="flex-row justify-between">
              <Text className="text-[12px] text-emerald-700 font-semibold">Възстановяване</Text>
              <Text className="text-[12px] text-emerald-700 font-semibold">€{refund.toFixed(2)}</Text>
            </View>
          </MCard>
          <CTA
            label={t('mentee.bookings.cancel_cta', { amount: fee.toFixed(2) })}
            onPress={handleCancel}
            loading={cancel.isPending}
            disabled={isAlreadyStarted}
            className="mt-4 bg-coral"
          />
          <TouchableOpacity onPress={onDismiss} className="mt-3 py-3 items-center">
            <Text className="text-[13.5px] font-semibold text-ink">{t('mentee.bookings.keep')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
