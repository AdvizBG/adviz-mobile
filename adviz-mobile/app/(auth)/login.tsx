import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useForm } from '@tanstack/react-form';
import { Eye, EyeOff, AlertCircle } from 'lucide-react-native';
import { CTA } from '../../src/components/ui/CTA';
import { useToast } from '../../src/components/ui/ToastProvider';
import { useLogin } from '../../src/features/Auth/api/hooks';
import { loginSchema } from '../../src/features/Auth/schemas/auth';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { show } = useToast();
  const login = useLogin();
  const [showPwd, setShowPwd] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { email: '', password: '' },
    validators: { onChange: loginSchema },
    onSubmit: async ({ value }) => {
      try {
        await login.mutateAsync(value);
        // navigation handled by root auth guard
      } catch (err: unknown) {
        const data = (err as { response?: { data?: { remaining_attempts?: number } } })?.response
          ?.data;
        const attempts = data?.remaining_attempts;
        if (attempts !== undefined) setRemainingAttempts(attempts);
        setFieldError(t('auth.login.error_field'));
        show({
          tone: 'error',
          title: t('auth.login.error_title'),
          body: t('auth.login.error_body'),
        });
        if (attempts === 0) {
          show({
            tone: 'info',
            title: 'Account temporarily locked',
            body: 'Please reset your password.',
          });
        }
      }
    },
  });

  const hasError = !!fieldError;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        className="flex-1 bg-cream"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        <LinearGradient
          colors={['#E0E0FF', '#FAF7F2']}
          style={{
            height: 280,
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingBottom: 24,
          }}
        >
          <Text
            style={{
              fontFamily: 'InriaSans_400Regular',
              fontSize: 40,
              letterSpacing: 4,
              color: '#1B1B43',
            }}
          >
            adviz
          </Text>
          <Text className="text-[13px] text-ink/55 mt-1">
            Намери своя ментор / Find your mentor
          </Text>
        </LinearGradient>

        <View className="px-6 pt-2">
          <Text className="text-[26px] font-light tracking-tight text-ink">
            {t('auth.login.title')}
          </Text>
          <Text className="text-[13.5px] text-ink/55 mt-1">{t('auth.login.subtitle')}</Text>

          {/* Email field */}
          <form.Field name="email">
            {(field) => (
              <View className="mt-5">
                <Text className="text-[11.5px] font-semibold text-ink/65 mb-1.5">
                  {t('auth.login.email')}
                </Text>
                <TextInput
                  className="px-3.5 py-3 rounded-xl border border-line-strong bg-white text-[14px] text-ink"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={field.state.value}
                  onChangeText={field.handleChange}
                  onBlur={field.handleBlur}
                />
              </View>
            )}
          </form.Field>

          {/* Password field */}
          <form.Field name="password">
            {(field) => (
              <View className="mt-4">
                <Text className="text-[11.5px] font-semibold text-ink/65 mb-1.5">
                  {t('auth.login.password')}
                </Text>
                <View style={{ position: 'relative' }}>
                  <TextInput
                    className={`px-3.5 py-3 rounded-xl bg-white text-[14px] text-ink pr-12 ${
                      hasError ? 'border-2 border-coral' : 'border border-line-strong'
                    }`}
                    secureTextEntry={!showPwd}
                    value={field.state.value}
                    onChangeText={(v) => {
                      field.handleChange(v);
                      setFieldError(null);
                    }}
                    onBlur={field.handleBlur}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPwd((p) => !p)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: [{ translateY: -10 }],
                    }}
                    accessibilityLabel={showPwd ? 'Hide password' : 'Show password'}
                  >
                    {showPwd ? (
                      <EyeOff size={20} color="#888" />
                    ) : (
                      <Eye size={20} color="#888" />
                    )}
                  </TouchableOpacity>
                </View>
                {fieldError && (
                  <View className="flex-row items-center gap-1 mt-1">
                    <AlertCircle size={12} color="#FE5B52" />
                    <Text className="text-[11.5px] text-coral">{fieldError}</Text>
                  </View>
                )}
              </View>
            )}
          </form.Field>

          {remainingAttempts !== null && (
            <Text className="text-[12px] text-ink/55 mt-2">
              {t('auth.login.attempts_left', { count: remainingAttempts })}
            </Text>
          )}

          <TouchableOpacity className="mt-2 self-end">
            <Text className="text-[12.5px] font-medium text-purple-deep">
              {t('auth.login.forgot')}
            </Text>
          </TouchableOpacity>

          <CTA
            label={hasError ? t('auth.login.try_again') : t('auth.login.submit')}
            onPress={form.handleSubmit}
            loading={login.isPending}
            className="mt-5"
          />

          <View className="flex-row items-center gap-3 mt-5">
            <View className="flex-1 h-px bg-line-strong" />
            <Text className="text-[11px] uppercase tracking-wider text-ink/40 font-semibold">
              {t('auth.login.or')}
            </Text>
            <View className="flex-1 h-px bg-line-strong" />
          </View>

          <TouchableOpacity className="mt-3 w-full py-3 rounded-2xl border border-line-strong bg-white items-center justify-center flex-row gap-2.5">
            <Text className="text-[14px] font-semibold text-ink">{t('auth.login.google')}</Text>
          </TouchableOpacity>

          <View className="flex-row justify-center mt-4 gap-1">
            <Text className="text-[13px] text-ink/60">{t('auth.login.signup_prompt')}</Text>
            <Link href="/(auth)/register">
              <Text className="text-[13px] font-semibold text-purple-deep">
                {t('auth.login.signup_link')}
              </Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
