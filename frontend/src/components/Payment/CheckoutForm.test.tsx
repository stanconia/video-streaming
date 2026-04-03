import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CheckoutForm } from './CheckoutForm';
import { paymentApi } from '../../services/api/payment/PaymentApi';

jest.mock('../../services/api/payment/PaymentApi', () => ({
  paymentApi: {
    getStripeConfig: jest.fn(),
    createPaymentIntent: jest.fn(),
  },
}));

const mockConfirmPayment = jest.fn();
const mockUseStripe = jest.fn(() => ({ confirmPayment: mockConfirmPayment }));
const mockUseElements = jest.fn(() => ({}));

jest.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: any) => <div data-testid="stripe-elements">{children}</div>,
  PaymentElement: () => <div data-testid="stripe-payment-element">Stripe Payment Element</div>,
  useStripe: () => mockUseStripe(),
  useElements: () => mockUseElements(),
}));

jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(() => Promise.resolve({ fake: 'stripe' })),
}));

jest.mock('../Coupon/CouponInput', () => ({
  CouponInput: ({ onApply, onClear }: any) => (
    <div data-testid="coupon-input">
      <button data-testid="apply-coupon" onClick={() => onApply({ discountPercent: 10 })}>
        Apply Coupon
      </button>
      <button data-testid="clear-coupon" onClick={() => onClear()}>
        Clear Coupon
      </button>
    </div>
  ),
}));

const mockPaymentApi = paymentApi as jest.Mocked<typeof paymentApi>;

const defaultProps = {
  classId: 'class-1',
  amount: 2999,
  currency: 'USD',
  onSuccess: jest.fn(),
  onCancel: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('CheckoutForm', () => {
  it('shows loading state while initializing payment', () => {
    mockPaymentApi.getStripeConfig.mockImplementation(() => new Promise(() => {}));

    render(<CheckoutForm {...defaultProps} />);

    expect(screen.getByText('Initializing payment...')).toBeInTheDocument();
  });

  it('shows error when getStripeConfig fails', async () => {
    mockPaymentApi.getStripeConfig.mockRejectedValue({
      response: { data: { error: 'Config unavailable' } },
    });

    render(<CheckoutForm {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Config unavailable')).toBeInTheDocument();
    });
  });

  it('shows default error when API fails with no error detail', async () => {
    mockPaymentApi.getStripeConfig.mockRejectedValue(new Error('Network error'));

    render(<CheckoutForm {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to initialize payment')).toBeInTheDocument();
    });
  });
});
