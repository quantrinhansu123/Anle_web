import type { Candidate, FilterOption, InterviewSession } from './types';

export const candidatesData: Candidate[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '0901234567',
    birthYear: '1995',
    position: 'Senior Software Engineer',
    positionId: 'DX-2025-001',
    status: 'interviewing',
    source: 'Company Website',
    latestInterview: '16:00 - 10/02/2025',
    latestResult: 'Passed, waiting for Round 2',
    createdAt: '17:00 - 15/01/2025',
    documents: [
      { id: 'd1', name: 'CV_John_Doe.pdf', type: 'CV', link: '#' },
      { id: 'd2', name: 'University_Degree.pdf', type: 'Degree', link: '#' },
    ],
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '0912345678',
    birthYear: '—',
    position: 'HR Specialist',
    positionId: 'DX-2025-002',
    status: 'hired',
    source: 'Internal Referral',
    latestInterview: '21:00 - 25/01/2025',
    latestResult: 'Hired, offer letter sent',
    createdAt: '15:30 - 08/01/2025',
    documents: [{ id: 'd3', name: 'CV_Jane_Smith.pdf', type: 'CV', link: '#' }],
  },
  {
    id: '3',
    name: 'Robert Brown',
    email: 'robert.brown@example.com',
    phone: '0987654321',
    birthYear: '1992',
    position: 'Senior Software Engineer',
    positionId: 'DX-2025-001',
    status: 'new',
    source: 'Job Board',
    latestInterview: '—',
    latestResult: '—',
    createdAt: '18:00 - 01/02/2025',
    documents: [],
  },
  {
    id: '4',
    name: 'Emily Davis',
    email: 'emily.davis@example.com',
    phone: '0777123456',
    birthYear: '—',
    position: 'Frontend Developer',
    positionId: 'DX-2025-004',
    status: 'rejected',
    source: 'LinkedIn',
    latestInterview: '17:00 - 18/01/2025',
    latestResult: 'Rejected',
    createdAt: '16:00 - 20/12/2024',
    documents: [{ id: 'd4', name: 'CV_Emily_Davis.pdf', type: 'CV', link: '#' }],
  },
];

export const statusConfig: Record<Candidate['status'], { label: string; classes: string }> = {
  new: { label: 'New', classes: 'bg-blue-500/10 text-blue-600 border-blue-200' },
  interviewing: { label: 'Interviewing', classes: 'bg-sky-500/10 text-sky-600 border-sky-100' },
  hired: { label: 'Hired', classes: 'bg-indigo-500/10 text-indigo-600 border-indigo-100' },
  rejected: { label: 'Rejected', classes: 'bg-emerald-500/10 text-emerald-600 border-emerald-100' },
};

export const sourceConfig: Record<string, { label: string; classes: string }> = {
  'Company Website': { label: 'Company Website', classes: 'bg-sky-500/10 text-sky-500 border-sky-100' },
  'Internal Referral': { label: 'Internal Referral', classes: 'bg-indigo-500/10 text-indigo-500 border-indigo-100' },
  'Job Board': { label: 'Job Board', classes: 'bg-orange-500/10 text-orange-500 border-orange-100' },
  'LinkedIn': { label: 'LinkedIn', classes: 'bg-purple-500/10 text-purple-500 border-purple-100' },
};

export const statusOptions: FilterOption[] = [
  { id: 'new', label: 'New', count: 1 },
  { id: 'interviewing', label: 'Interviewing', count: 1 },
  { id: 'rejected', label: 'Rejected', count: 1 },
  { id: 'hired', label: 'Hired', count: 1 },
];

export const positionOptions: FilterOption[] = [
  { id: 'DX-2025-001', label: 'DX-2025-001 · Senior Software Engineer', count: 2 },
  { id: 'DX-2025-002', label: 'DX-2025-002 · HR Specialist', count: 1 },
  { id: 'DX-2025-004', label: 'DX-2025-004 · Frontend Developer', count: 1 },
];

export const sourceOptions: FilterOption[] = [
  { id: 'Company Website', label: 'Company Website', count: 1 },
  { id: 'LinkedIn', label: 'LinkedIn', count: 1 },
  { id: 'Internal Referral', label: 'Internal Referral', count: 1 },
  { id: 'Job Board', label: 'Job Board', count: 1 },
];

export const mockInterviewSessions: InterviewSession[] = [
  {
    round: 1,
    date: '2026-03-10',
    time: '09:00',
    format: 'Direct',
    location: 'Meeting Room A, Floor 3',
    status: 'Completed',
    statusColor: 'emerald',
    evalStatus: 'Passed',
    score: '8/10',
    comment: 'Candidate has good experience, excellent communication, and a positive attitude. Needs more team management experience.',
    result: 'Pass',
  },
  {
    round: 2,
    date: '2026-03-17',
    time: '14:00',
    format: 'Online',
    location: 'Google Meet (link sent later)',
    status: 'Pending',
    statusColor: 'orange',
    evalStatus: 'Not Evaluated',
    score: '',
    comment: '',
    result: '',
  },
];
