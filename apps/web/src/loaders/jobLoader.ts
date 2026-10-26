import type { LoaderFunctionArgs } from 'react-router-dom';
import { JobSchema, type Job } from '@react-dev/shared';

// Loads a single job for /jobs/:id and /edit-job/:id. Failures are thrown as
// Responses so the route's errorElement can tell a 404 from other errors.
export const jobLoader = async ({ params }: LoaderFunctionArgs): Promise<Job> => {
    if (!params.id) {
        throw new Response('Job not found', { status: 404, statusText: 'Not Found' });
    }
    const res = await fetch('/api/jobs/' + params.id);
    if (res.status === 404) {
        throw new Response('Job not found', { status: 404, statusText: 'Not Found' });
    }
    if (!res.ok) {
        throw new Response('Failed to load job', { status: res.status, statusText: res.statusText });
    }
    const data: unknown = await res.json();
    const parsed = JobSchema.safeParse(data);
    if (!parsed.success) {
        throw new Response('Invalid job data', { status: 502, statusText: 'Invalid job data' });
    }
    return parsed.data;
};
