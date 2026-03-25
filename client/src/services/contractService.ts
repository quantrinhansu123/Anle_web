import { apiFetch } from '../lib/api';
import type { Contract, CreateContractDto, UpdateContractDto } from '../pages/contracts/types';

export const contractService = {
  getContracts: (page = 1, limit = 20) => 
    apiFetch<Contract[]>(`/contracts?page=${page}&limit=${limit}`),

  getContractById: (id: string) => 
    apiFetch<Contract>(`/contracts/${id}`),

  createContract: (dto: CreateContractDto) => 
    apiFetch<Contract>('/contracts', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  updateContract: (id: string, dto: UpdateContractDto) => 
    apiFetch<Contract>(`/contracts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),

  deleteContract: (id: string) => 
    apiFetch<void>(`/contracts/${id}`, {
      method: 'DELETE',
    }),
};
