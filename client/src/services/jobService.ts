import { apiFetch } from '../lib/api';
import type { FmsJob, JobUpsertPayload, JobWorkflowStatus } from '../pages/jobs/types';

export const jobService = {
  getJobs: (page = 1, limit = 200) => apiFetch<FmsJob[]>(`/jobs?page=${page}&limit=${limit}`),

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
};
