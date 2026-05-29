import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useForm } from '@tanstack/react-form';
import { zodValidator } from '@tanstack/zod-form-adapter';
import { CheckSquare, Square } from 'lucide-react-native';
import { AppHeader } from '../../src/components/ui/AppHeader';
import { CTA } from '../../src/components/ui/CTA';
import { useRegister } from '../../src/features/Auth/api/hooks';
import { registerSchema } from '../../src/features/Auth/schemas/auth';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const register = useRegister();

  const form = useForm({
    defaultValues: { full_name: '', email: '', password: '', confirm_password: '', terms: false as true },
    validatorAdapter: zodValidator(),
    validators: { onChange: registerSchema },
    onSubmit: async ({ value }) => {
      await register.mutateAsync({ full_name: value.full_name, email: value.email, password: value.password });
      router.replace('/(auth)/login');
    },
  });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <View className="flex-1 bg-cream">
        <AppHeader showBack title="" right={
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
            <Text className="text-[13px] font-semibold text-purple-deep">{t('auth.login.submit')}</Text>
          </TouchableOpacity>
        } />
        <ScrollView contentContainerStyle={{ paddingTop: 116, paddingHorizontal: 24, paddingBottom: insets.bottom + 24 }}>
          <Image
            source={require('../../assets/adviz-logo.png')}
            style={{ width: 36, height: 36, marginBottom: 16 }}
            resizeMode="contain"
          />
          <Text className="text-[28px] font-light tracking-tight text-ink leading-[1.1]">{t('auth.register.title')}</Text>
          <Text className="text-[13.5px] text-ink/55 mt-2 max-w-[300px]">{t('auth.register.subtitle')}</Text>

          {(['full_name', 'email', 'password', 'confirm_password'] as const).map((name) => (
            <form.Field key={name} name={name}>
              {(field) => {
                const isConfirm = name === 'confirm_password';
                const passwordVal = form.getFieldValue('password');
                const matching = isConfirm && field.state.value.length > 0 && field.state.value === passwordVal;
                return (
                  <View className="mt-4">
                    <Text className="text-[11.5px] font-semibold text-ink/65 mb-1.5">{t(`auth.register.${name}`)}</Text>
                    <View>
                      <TextInput
                        className="px-3.5 py-3 rounded-xl border border-line-strong bg-white text-[14px] text-ink"
                        secureTextEntry={name === 'password' || name === 'confirm_password'}
                        keyboardType={name === 'email' ? 'email-address' : 'default'}
                        autoCapitalize={name === 'email' || name === 'password' || name === 'confirm_password' ? 'none' : 'words'}
                        autoComplete={name === 'email' ? 'email' : name === 'password' ? 'new-password' : name === 'confirm_password' ? 'new-password' : 'name'}
                        textContentType={name === 'email' ? 'emailAddress' : name === 'password' ? 'newPassword' : name === 'confirm_password' ? 'newPassword' : 'name'}
                        value={field.state.value}
                        onChangeText={field.handleChange}
                        onBlur={field.handleBlur}
                      />
                      {matching && (
                        <Text className="absolute right-3 top-3 text-[11.5px] text-teal font-semibold">{t('auth.register.passwords_match')}</Text>
                      )}
                    </View>
                    {field.state.meta.errors.length > 0 && (
                      <Text className="text-[11px] text-coral mt-1">{field.state.meta.errors[0]?.toString()}</Text>
                    )}
                  </View>
                );
              }}
            </form.Field>
          ))}

          <form.Field name="terms">
            {(field) => (
              <TouchableOpacity className="flex-row items-center gap-2 mt-4" onPress={() => field.handleChange(!field.state.value as true)}>
                {field.state.value ? <CheckSquare size={16} color="#3E1D87" /> : <Square size={16} color="#DAD6CC" />}
                <Text className="text-[12px] text-ink/60">{t('auth.register.terms')}</Text>
              </TouchableOpacity>
            )}
          </form.Field>

          <form.Subscribe selector={(state) => state.values.terms}>
            {(termsAccepted) => (
              <CTA label={t('auth.register.submit')} onPress={form.handleSubmit} loading={register.isPending} disabled={!termsAccepted} className="mt-5" />
            )}
          </form.Subscribe>

          <Text className="text-[12px] text-ink/50 text-center mt-3">
            {t('auth.register.discount_nudge', { percent: '90' })}
          </Text>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
