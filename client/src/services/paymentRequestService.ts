import { apiFetch } from '../lib/api';
import type { PaymentRequest, PaymentRequestFormState } from '../pages/payment-requests/types';

export const paymentRequestService = {
  getPaymentRequests: (page = 1, limit = 20) => 
    apiFetch<PaymentRequest[]>(`/payment-requests?page=${page}&limit=${limit}`),

  getPaymentRequestById: (id: string) => 
    apiFetch<PaymentRequest>(`/payment-requests/${id}`),

  createPaymentRequest: (dto: PaymentRequestFormState) => 
    apiFetch<PaymentRequest>('/payment-requests', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  updatePaymentRequest: (id: string, dto: PaymentRequestFormState) => 
    apiFetch<PaymentRequest>(`/payment-requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),

  deletePaymentRequest: (id: string) => 
    apiFetch<void>(`/payment-requests/${id}`, {
      method: 'DELETE',
    }),
};
