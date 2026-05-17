import React, { createContext, useContext, useRef, useState, useCallback } from 'react';
import { Animated, View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react-native';

type Tone = 'success' | 'error' | 'info' | 'warning';

interface ToastConfig {
  tone: Tone;
  title: string;
  body?: string;
  action?: { label: string; onPress: () => void };
}

interface ToastContextValue {
  show: (config: ToastConfig) => void;
}

const ToastContext = createContext<ToastContextValue>({ show: () => {} });

const TONE_STYLES: Record<Tone, { bg: string; border: string; iconBg: string; Icon: React.ElementType }> = {
  success: { bg: '#F0FDF4', border: '#A7F3D0', iconBg: '#10B981', Icon: CheckCircle },
  error:   { bg: '#FFF1F2', border: '#FECDD3', iconBg: '#FE5B52', Icon: AlertCircle },
  info:    { bg: '#E0E0FF', border: '#CBCBFF', iconBg: '#3E1D87', Icon: Info },
  warning: { bg: '#FFFBEB', border: '#FDE68A', iconBg: '#F59E0B', Icon: AlertTriangle },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastConfig | null>(null);
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const show = useCallback((config: ToastConfig) => {
    clearTimeout(timerRef.current);
    setToast(config);
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }).start();
    timerRef.current = setTimeout(() => {
      Animated.spring(slideAnim, { toValue: -120, useNativeDriver: true }).start(() => setToast(null));
    }, 4000);
  }, [slideAnim]);

  const dismiss = () => {
    clearTimeout(timerRef.current);
    Animated.spring(slideAnim, { toValue: -120, useNativeDriver: true }).start(() => setToast(null));
  };

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && (() => {
        const s = TONE_STYLES[toast.tone];
        const Icon = s.Icon;
        return (
          <Animated.View
            style={{
              position: 'absolute',
              left: 12,
              right: 12,
              top: insets.top + 8,
              zIndex: 50,
              transform: [{ translateY: slideAnim }],
            }}
          >
            <View style={{ borderRadius: 16, borderWidth: 1, backgroundColor: s.bg, borderColor: s.border, padding: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: s.iconBg, alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={14} color="white" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#1B1B43' }}>{toast.title}</Text>
                {toast.body && <Text style={{ fontSize: 11.5, color: 'rgba(27,27,67,0.65)', marginTop: 2 }}>{toast.body}</Text>}
                {toast.action && (
                  <TouchableOpacity onPress={() => { toast.action?.onPress(); dismiss(); }}>
                    <Text style={{ fontSize: 11.5, fontWeight: '600', color: '#3E1D87', marginTop: 4 }}>{toast.action.label}</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity onPress={dismiss}><X size={16} color="rgba(27,27,67,0.4)" /></TouchableOpacity>
            </View>
          </Animated.View>
        );
      })()}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
