import { useNavigate, useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import {
    LuArrowLeft,
    LuBanknote,
    LuChevronRight,
    LuClock,
    LuExternalLink,
    LuGlobe,
    LuInfo,
    LuMail,
    LuMapPin,
    LuPencil,
    LuPhone,
    LuTrash2,
} from 'react-icons/lu';
import { useAuth } from '@/auth/AuthContext';
import { isHtmlDescription, safeDescriptionHtml } from '@/lib/description';
import { formatRelativeTime } from '@/lib/formatRelativeTime';
import { formatSalaryRange } from '@/lib/formatSalary';
import { canManageJob } from '@/lib/permissions';
import { useDeleteJob, useJob } from '@/lib/queries/jobs';
import { buttonDanger, buttonPrimary, buttonSecondary, card, pageContainer } from '@/lib/styles';
import { Badge, JobTypeBadge, RemoteBadge, Tag } from '@/components/Badge';
import CompanyAvatar from '@/components/CompanyAvatar';
import SaveJobButton from '@/components/SaveJobButton';

const SOURCE_NAMES = { GREENHOUSE: 'Greenhouse', LEVER: 'Lever' } as const;

const SideHeading = ({ children }: { children: string }) => (
    <h2 className="mb-3 text-sm font-semibold text-slate-900">{children}</h2>
);

const JobPage = () => {
    const { id = '' } = useParams();
    const { data: jobData } = useJob(id);
    const { user } = useAuth();
    const canManage = canManageJob(user, jobData);
    const navigate = useNavigate();
    const deleteJob = useDeleteJob();
    const { company } = jobData;
    const importedFrom = jobData.source === 'MANUAL' ? null : SOURCE_NAMES[jobData.source];

    // Optimistic: leave for the list straight away. The job is already gone
    // from it; if the delete fails it is restored and a toast explains why.
    const onDeleteClick = () => {
        if (!window.confirm('Are you sure you want to delete this job?')) return;
        deleteJob.mutate(jobData);
        void navigate('/jobs');
    };

    return (
        <div className={`${pageContainer} py-8`}>
            <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                <Link to="/jobs" className="inline-flex items-center gap-1.5 font-medium text-indigo-600 hover:text-indigo-700">
                    <LuArrowLeft aria-hidden /> Back to jobs
                </Link>
                <span aria-hidden className="text-slate-300">|</span>
                <Link to="/jobs" className="hover:text-slate-700">Jobs</Link>
                <LuChevronRight aria-hidden className="text-slate-400" />
                <span className="truncate max-w-xs text-slate-700" aria-current="page">{jobData.title}</span>
            </nav>

            {/* Header */}
            <div className={`${card} p-6 sm:p-8`}>
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                    <CompanyAvatar name={company.name} size="lg" />
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-slate-900">{company.name}</p>
                            {importedFrom && <Badge>Imported from {importedFrom}</Badge>}
                        </div>
                        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                            {jobData.title}
                        </h1>
                        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600">
                            <span className="inline-flex items-center gap-1.5">
                                <LuMapPin aria-hidden className="text-slate-400" /> {jobData.location}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <LuBanknote aria-hidden className="text-slate-400" /> {formatSalaryRange(jobData)}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <LuClock aria-hidden className="text-slate-400" /> Posted{' '}
                                <time dateTime={jobData.postedAt} title={new Date(jobData.postedAt).toLocaleString()}>
                                    {formatRelativeTime(jobData.postedAt)}
                                </time>
                            </span>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-1.5">
                            <JobTypeBadge type={jobData.type} />
                            <RemoteBadge remote={jobData.remote} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_22rem]">
                {/* Description */}
                <article className={`${card} p-6 sm:p-8`} aria-labelledby="about-role">
                    <h2 id="about-role" className="flex items-center gap-2.5 text-lg font-semibold text-slate-900">
                        <span aria-hidden className="h-5 w-1 rounded-full bg-indigo-600" /> About the role
                    </h2>
                    <div className="mt-5 max-w-[70ch]">
                        {isHtmlDescription(jobData) ? (
                            // Imported posting: HTML sanitized by the API and again here.
                            <div
                                className="job-description"
                                dangerouslySetInnerHTML={{ __html: safeDescriptionHtml(jobData.description) }}
                            />
                        ) : (
                            <p className="whitespace-pre-line text-[15px] leading-7 text-slate-700">{jobData.description}</p>
                        )}
                    </div>
                </article>

                {/* Sidebar */}
                <aside className="space-y-5 lg:sticky lg:top-24">
                    <div className={`${card} p-5`}>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Next step</p>
                        <p className="mb-4 font-semibold text-slate-900">Ready to apply?</p>
                        <div className="flex flex-col gap-2">
                            {jobData.externalUrl && (
                                <a
                                    href={jobData.externalUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`${buttonPrimary} w-full`}
                                >
                                    Apply on company site <LuExternalLink aria-hidden />
                                    <span className="sr-only">(opens in a new tab)</span>
                                </a>
                            )}
                            <SaveJobButton jobId={jobData.id} jobTitle={jobData.title} className="w-full" />
                        </div>
                        {importedFrom && (
                            <p className="mt-4 flex gap-2 text-xs leading-5 text-slate-500">
                                <LuInfo aria-hidden className="mt-0.5 shrink-0" />
                                Imported from the company&apos;s {importedFrom} board and kept up to date
                                automatically, so it can&apos;t be edited here.
                            </p>
                        )}
                    </div>

                    {jobData.tags.length > 0 && (
                        <div className={`${card} p-5`}>
                            <SideHeading>Skills and tags</SideHeading>
                            <ul className="flex flex-wrap gap-1.5" aria-label="Tags">
                                {jobData.tags.map((tag) => (
                                    <li key={tag}><Tag>{tag}</Tag></li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className={`${card} p-5`}>
                        <div className="flex items-center gap-3">
                            <CompanyAvatar name={company.name} size="sm" />
                            <div className="min-w-0">
                                <h2 className="truncate font-semibold text-slate-900">{company.name}</h2>
                                {company.website && (
                                    <a
                                        href={company.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700"
                                    >
                                        <LuGlobe aria-hidden /> {company.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                                    </a>
                                )}
                            </div>
                        </div>
                        {company.description && (
                            <p className="mt-4 text-sm leading-6 text-slate-600">{company.description}</p>
                        )}
                        {(company.contactEmail ?? company.contactPhone) && (
                            <dl className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
                                {company.contactEmail && (
                                    <div className="flex items-center gap-2">
                                        <dt><LuMail aria-label="Contact email" className="text-slate-400" /></dt>
                                        <dd className="break-all text-slate-700">
                                            <a href={`mailto:${company.contactEmail}`} className="hover:text-indigo-600">{company.contactEmail}</a>
                                        </dd>
                                    </div>
                                )}
                                {company.contactPhone && (
                                    <div className="flex items-center gap-2">
                                        <dt><LuPhone aria-label="Contact phone" className="text-slate-400" /></dt>
                                        <dd className="text-slate-700">{company.contactPhone}</dd>
                                    </div>
                                )}
                            </dl>
                        )}
                    </div>

                    {/* Manage: only for the employer who posted the job */}
                    {canManage && (
                        <div className={`${card} p-5`}>
                            <SideHeading>Manage this job</SideHeading>
                            <div className="grid grid-cols-2 gap-2">
                                <Link to={`/edit-job/${jobData.id}`} className={buttonSecondary}>
                                    <LuPencil aria-hidden /> Edit job
                                </Link>
                                <button onClick={onDeleteClick} className={buttonDanger}>
                                    <LuTrash2 aria-hidden /> Delete
                                </button>
                            </div>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
}

export default JobPage;
