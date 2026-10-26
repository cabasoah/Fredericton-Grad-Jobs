import type { LoaderFunctionArgs } from 'react-router-dom';
import { JobSchema, type Job } from '@fredericton-grad-jobs/shared';
import { ApiError, apiFetch } from '@/lib/api';

// Loads a single job for /jobs/:id and /edit-job/:id. Failures are thrown as
// Responses so the route's errorElement can tell a 404 from other errors.
export const jobLoader = async ({ params }: LoaderFunctionArgs): Promise<Job> => {
    if (!params.id) {
        throw new Response('Job not found', { status: 404, statusText: 'Not Found' });
    }
    let data: unknown;
    try {
        data = await apiFetch(`/jobs/${encodeURIComponent(params.id)}`);
    } catch (err) {
        if (err instanceof ApiError) {
            throw new Response(err.message, { status: err.status, statusText: err.message });
        }
        throw err;
    }
    const parsed = JobSchema.safeParse(data);
    if (!parsed.success) {
        throw new Response('Invalid job data', { status: 502, statusText: 'Invalid job data' });
    }
    return parsed.data;
};
