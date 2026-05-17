import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal } from 'react-native';
import { Star } from 'lucide-react-native';
import { CTA } from '../../../components/ui/CTA';
import { useCreateReview } from '../api/hooks';
import { useTranslation } from 'react-i18next';

interface ReviewSheetProps {
  sessionId: string;
  visible: boolean;
  onDismiss: () => void;
}

export function ReviewSheet({ sessionId, visible, onDismiss }: ReviewSheetProps) {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const createReview = useCreateReview();

  async function handleSubmit() {
    if (rating === 0 || body.length < 20) return;
    await createReview.mutateAsync({ sessionId, body: { rating, body } });
    onDismiss();
  }

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onDismiss}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,10,50,0.55)' }}>
        <View className="bg-white rounded-t-[28px] pb-9 pt-4 px-5">
          <View className="w-9 h-1 rounded-full bg-line-strong self-center mb-4" />
          <Text className="text-[19px] font-semibold text-ink text-center">{t('mentee.bookings.review_title')}</Text>
          <View className="flex-row justify-center gap-2 mt-4">
            {[1, 2, 3, 4, 5].map((s) => (
              <TouchableOpacity key={s} onPress={() => setRating(s)}>
                <Star size={32} color="#F59E0B" fill={s <= rating ? '#F59E0B' : 'transparent'} />
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            className="mt-4 px-3.5 py-3 rounded-xl border border-line-strong bg-white text-[13.5px] text-ink"
            placeholder="Сподели опита си (мин. 20 знака)"
            value={body}
            onChangeText={setBody}
            multiline
            numberOfLines={4}
            style={{ textAlignVertical: 'top' }}
          />
          <Text className="text-[10.5px] text-ink/45 text-right mt-1">{body.length}/500</Text>
          <CTA
            label={t('mentee.bookings.review_submit')}
            onPress={handleSubmit}
            disabled={rating === 0 || body.length < 20}
            loading={createReview.isPending}
            className="mt-4"
          />
        </View>
      </View>
    </Modal>
  );
}
