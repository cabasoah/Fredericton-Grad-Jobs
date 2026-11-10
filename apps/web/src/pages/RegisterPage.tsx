import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PASSWORD_MIN_LENGTH, RegisterSchema, type UserRole } from "@fredericton-grad-jobs/shared";
import { LuArrowRight, LuBriefcase, LuCircle, LuCircleCheck, LuGraduationCap } from "react-icons/lu";
import { safeReturnTo, useAuth } from "@/auth/AuthContext";
import { ApiError } from "@/lib/api";
import { apiFieldErrors, isFieldOf } from "@/lib/fieldErrors";
import { buttonPrimary, errorTextClass, hintClass, inputClass, labelClass, textareaClass } from "@/lib/styles";
import AuthCard from "@/components/AuthCard";
import PasswordInput from "@/components/PasswordInput";

const REGISTER_FIELDS = ["email", "password", "name", "company.name"] as const;

const ROLE_OPTIONS: { role: UserRole; label: string; Icon: typeof LuGraduationCap }[] = [
  { role: "SEEKER", label: "I'm looking for a job", Icon: LuGraduationCap },
  { role: "EMPLOYER", label: "I'm hiring", Icon: LuBriefcase },
];

// Optional inputs send nothing (not "") when left blank.
const blankToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const ErrorText = ({ id, message }: { id: string; message?: string }) =>
  message ? <p id={id} className={errorTextClass}>{message}</p> : null;

const RegisterPage = () => {
  const { register: registerAccount } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = safeReturnTo(searchParams.get("returnTo"));

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(RegisterSchema),
    // Company fields are only part of the values while they are shown
    // (employers); job seekers must not send a company at all.
    shouldUnregister: true,
    defaultValues: { role: "SEEKER", email: "", password: "", name: "" },
  });
  const role = watch("role");
  const passwordLongEnough = (watch("password") ?? "").length >= PASSWORD_MIN_LENGTH;
  const companyErrors = "company" in errors ? errors.company : undefined;

  const onSubmit = handleSubmit(async (values) => {
    try {
      const user = await registerAccount(values);
      // Employers usually came here to post a job.
      void navigate(returnTo === "/" && user.role === "EMPLOYER" ? "/add-job" : returnTo, { replace: true });
    } catch (err) {
      const fieldErrors = apiFieldErrors(err);
      for (const { path, message } of fieldErrors) {
        if (isFieldOf(REGISTER_FIELDS, path)) setError(path, { message });
      }
      if (fieldErrors.length === 0) {
        setError("root.server", {
          message: err instanceof ApiError ? err.message : "Could not create the account. Please try again.",
        });
      }
    }
  });

  return (
    <AuthCard
      title="Create your account"
      subtitle="Track your job search, or post roles for your company."
      width="lg"
      footer={
        <>
          Already have an account?{" "}
          <Link to={`/login?returnTo=${encodeURIComponent(returnTo)}`} className="font-medium text-indigo-600 hover:text-indigo-700">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={(e) => void onSubmit(e)} noValidate className="space-y-5">
        <fieldset>
          <legend className="sr-only">Account type</legend>
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
            {ROLE_OPTIONS.map(({ role: option, label, Icon }) => (
              <label key={option} className="relative cursor-pointer">
                <input type="radio" value={option} className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0" {...register("role")} />
                <span className="flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 peer-checked:bg-white peer-checked:text-indigo-700 peer-checked:shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500">
                  <Icon aria-hidden /> {label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="name" className={labelClass}>Full name</label>
          <input id="name" type="text" autoComplete="name" className={inputClass}
            aria-invalid={errors.name ? true : undefined} aria-describedby="name-error" {...register("name")} />
          <ErrorText id="name-error" message={errors.name?.message} />
        </div>

        <div>
          <label htmlFor="email" className={labelClass}>Email</label>
          <input id="email" type="email" autoComplete="email" placeholder="you@example.com" className={inputClass}
            aria-invalid={errors.email ? true : undefined} aria-describedby="email-error" {...register("email")} />
          <ErrorText id="email-error" message={errors.email?.message} />
        </div>

        <div>
          <label htmlFor="password" className={labelClass}>Password</label>
          <PasswordInput id="password" autoComplete="new-password"
            aria-invalid={errors.password ? true : undefined} aria-describedby="password-hint password-error" {...register("password")} />
          <p id="password-hint" className={`${hintClass} flex items-center gap-1.5 ${passwordLongEnough ? "text-emerald-700" : ""}`}>
            {passwordLongEnough ? <LuCircleCheck aria-hidden /> : <LuCircle aria-hidden />}
            At least {PASSWORD_MIN_LENGTH} characters.
          </p>
          <ErrorText id="password-error" message={errors.password?.message} />
        </div>

        {role === "EMPLOYER" && (
          <fieldset className="space-y-5 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <legend className="px-1 text-sm font-semibold text-slate-900">Your company</legend>
            <div>
              <label htmlFor="company_name" className={labelClass}>Company name</label>
              <input id="company_name" type="text" autoComplete="organization" className={inputClass}
                aria-invalid={companyErrors?.name ? true : undefined} aria-describedby="company-name-error" {...register("company.name")} />
              <ErrorText id="company-name-error" message={companyErrors?.name?.message} />
            </div>
            <div>
              <label htmlFor="company_website" className={labelClass}>Company website</label>
              <input id="company_website" type="url" placeholder="Optional, eg. https://example.com" className={inputClass}
                aria-describedby="company-website-error" {...register("company.website", { setValueAs: blankToUndefined })} />
              <ErrorText id="company-website-error" message={companyErrors?.website?.message} />
            </div>
            <div>
              <label htmlFor="company_description" className={labelClass}>Company description</label>
              <textarea id="company_description" rows={3} placeholder="Optional" className={textareaClass}
                {...register("company.description", { setValueAs: blankToUndefined })} />
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="contact_email" className={labelClass}>Contact email for applicants</label>
                <input id="contact_email" type="email" placeholder="Optional" className={inputClass}
                  aria-describedby="contact-email-error" {...register("company.contactEmail", { setValueAs: blankToUndefined })} />
                <ErrorText id="contact-email-error" message={companyErrors?.contactEmail?.message} />
              </div>
              <div>
                <label htmlFor="contact_phone" className={labelClass}>Contact phone</label>
                <input id="contact_phone" type="tel" placeholder="Optional" className={inputClass}
                  {...register("company.contactPhone", { setValueAs: blankToUndefined })} />
              </div>
            </div>
          </fieldset>
        )}

        {errors.root?.server && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
            {errors.root.server.message}
          </p>
        )}

        <button className={`${buttonPrimary} h-11 w-full`} type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating account..." : <>Create account <LuArrowRight aria-hidden /></>}
        </button>
      </form>
    </AuthCard>
  );
};

export default RegisterPage;
