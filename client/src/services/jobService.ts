import { apiFetch, apiFetchPaginated } from '../lib/api';
import type { FmsJob, JobUpsertPayload, JobWorkflowStatus } from '../pages/jobs/types';

export const jobService = {
  getJobs: (page = 1, limit = 200) => apiFetch<FmsJob[]>(`/jobs?page=${page}&limit=${limit}`),

  listJobsPaginated: (page = 1, limit = 50) =>
    apiFetchPaginated<FmsJob>(`/jobs?page=${page}&limit=${limit}`),

  getJob: (id: string) => apiFetch<FmsJob>(`/jobs/${id}`),

  createJob: (dto: JobUpsertPayload) =>
    apiFetch<FmsJob>('/jobs', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  updateJob: (id: string, dto: JobUpsertPayload) =>
    apiFetch<FmsJob>(`/jobs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),

  patchWorkflow: (id: string, workflow_status: JobWorkflowStatus) =>
    apiFetch<FmsJob>(`/jobs/${id}/workflow`, {
      method: 'PATCH',
      body: JSON.stringify({ workflow_status }),
    }),

  deleteJob: (id: string) =>
    apiFetch<null>(`/jobs/${id}`, {
      method: 'DELETE',
    }),

  getSeaHouseBl: (jobId: string) => apiFetch<Record<string, unknown>>(`/jobs/${jobId}/sea-house-bl`),

  patchSeaHouseBl: (jobId: string, patch: Record<string, unknown>) =>
    apiFetch<Record<string, unknown>>(`/jobs/${jobId}/sea-house-bl`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
};
