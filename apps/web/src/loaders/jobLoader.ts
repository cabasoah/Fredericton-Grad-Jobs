import type { LoaderFunctionArgs } from 'react-router-dom';
import { ApiError } from '@/lib/api';
import { jobQueryOptions } from '@/lib/queries/jobs';
import { queryClient } from '@/lib/queryClient';

// Loads a single job for /jobs/:id and /edit-job/:id into the query cache
// (reusing cached data when fresh). Failures are thrown as Responses so the
// route's errorElement can tell a 404 from other errors.
export const jobLoader = async ({ params }: LoaderFunctionArgs) => {
    if (!params.id) {
        throw new Response('Job not found', { status: 404, statusText: 'Not Found' });
    }
    try {
        return await queryClient.ensureQueryData(jobQueryOptions(params.id));
    } catch (err) {
        if (err instanceof ApiError) {
            throw new Response(err.message, { status: err.status, statusText: err.message });
        }
        throw err;
    }
};
