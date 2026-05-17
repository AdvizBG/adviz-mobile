export const useStripe = () => ({
  initPaymentSheet: jest.fn().mockResolvedValue({ error: undefined }),
  presentPaymentSheet: jest.fn().mockResolvedValue({ error: undefined }),
});
export const StripeProvider = ({ children }: { children: React.ReactNode }) => children;
