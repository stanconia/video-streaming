import axios from 'axios';
import { PaymentApi } from './PaymentApi';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => ({
      get: jest.fn(),
      post: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    })),
  },
}));

describe('PaymentApi', () => {
  let paymentApi: PaymentApi;
  let mockClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      get: jest.fn(),
      post: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    };
    (axios.create as jest.Mock).mockReturnValue(mockClient);
    localStorage.clear();
    paymentApi = new PaymentApi();
  });

  describe('createPaymentIntent', () => {
    it('calls POST /payments/create-intent with classId, amount, and currency', async () => {
      const mockResponse = {
        data: {
          clientSecret: 'pi_secret_123',
          paymentIntentId: 'pi_123',
        },
      };
      mockClient.post.mockResolvedValue(mockResponse);

      const result = await paymentApi.createPaymentIntent(
        { classId: 'class-1' },
        2999,
        'USD'
      );

      expect(mockClient.post).toHaveBeenCalledWith('/payments/create-intent', {
        classId: 'class-1',
        amount: 2999,
        currency: 'USD',
      });
      expect(result).toEqual({
        clientSecret: 'pi_secret_123',
        paymentIntentId: 'pi_123',
      });
    });

    it('calls POST /payments/create-intent with courseId', async () => {
      const mockResponse = {
        data: {
          clientSecret: 'pi_secret_456',
          paymentIntentId: 'pi_456',
        },
      };
      mockClient.post.mockResolvedValue(mockResponse);

      const result = await paymentApi.createPaymentIntent(
        { courseId: 'course-1' },
        4999,
        'EUR'
      );

      expect(mockClient.post).toHaveBeenCalledWith('/payments/create-intent', {
        courseId: 'course-1',
        amount: 4999,
        currency: 'EUR',
      });
      expect(result).toEqual({
        clientSecret: 'pi_secret_456',
        paymentIntentId: 'pi_456',
      });
    });

    it('uses USD as default currency', async () => {
      mockClient.post.mockResolvedValue({
        data: { clientSecret: 'secret', paymentIntentId: 'pi_1' },
      });

      await paymentApi.createPaymentIntent({ classId: 'class-1' }, 1000);

      expect(mockClient.post).toHaveBeenCalledWith('/payments/create-intent', {
        classId: 'class-1',
        amount: 1000,
        currency: 'USD',
      });
    });

    it('propagates errors from the API', async () => {
      const error = new Error('Payment failed');
      mockClient.post.mockRejectedValue(error);

      await expect(
        paymentApi.createPaymentIntent({ classId: 'class-1' }, 2999, 'USD')
      ).rejects.toThrow('Payment failed');
    });
  });

  describe('getStripeConfig', () => {
    it('calls GET /payments/config and returns the publishable key', async () => {
      const mockResponse = {
        data: { publishableKey: 'pk_test_abc123' },
      };
      mockClient.get.mockResolvedValue(mockResponse);

      const result = await paymentApi.getStripeConfig();

      expect(mockClient.get).toHaveBeenCalledWith('/payments/config');
      expect(result).toEqual({ publishableKey: 'pk_test_abc123' });
    });

    it('propagates errors from the API', async () => {
      const error = new Error('Config not available');
      mockClient.get.mockRejectedValue(error);

      await expect(paymentApi.getStripeConfig()).rejects.toThrow('Config not available');
    });
  });

  describe('interceptors', () => {
    it('sets up request and response interceptors', () => {
      expect(mockClient.interceptors.request.use).toHaveBeenCalled();
      expect(mockClient.interceptors.response.use).toHaveBeenCalled();
    });
  });
});
