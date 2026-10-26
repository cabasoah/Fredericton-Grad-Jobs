import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PASSWORD_MIN_LENGTH, RegisterSchema, USER_ROLE_LABELS, USER_ROLES } from "@fredericton-grad-jobs/shared";
import { safeReturnTo, useAuth } from "@/auth/AuthContext";
import { ApiError } from "@/lib/api";
import { apiFieldErrors, isFieldOf } from "@/lib/fieldErrors";

const REGISTER_FIELDS = ["email", "password", "name", "company.name"] as const;

const inputClass = "border rounded w-full py-2 px-3";
const labelClass = "block text-gray-700 font-bold mb-2";

// Optional inputs send nothing (not "") when left blank.
const blankToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const ErrorText = ({ id, message }: { id: string; message?: string }) =>
  message ? <p id={id} className="text-red-600 text-sm mt-1">{message}</p> : null;

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
    <section className="bg-indigo-50">
      <div className="container m-auto max-w-md py-24">
        <div className="bg-white px-6 py-8 mb-4 shadow-md rounded-md border m-4 md:m-0">
          <form onSubmit={(e) => void onSubmit(e)} noValidate>
            <h2 className="text-3xl text-center font-semibold mb-6">Create Account</h2>

            <fieldset className="mb-4">
              <legend className={labelClass}>I am a</legend>
              <div className="flex gap-6">
                {USER_ROLES.map((option) => (
                  <label key={option} className="flex items-center gap-2">
                    <input type="radio" value={option} {...register("role")} />
                    {USER_ROLE_LABELS[option]}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="mb-4">
              <label htmlFor="name" className={labelClass}>Your Name</label>
              <input id="name" type="text" autoComplete="name" className={inputClass}
                aria-invalid={errors.name ? true : undefined} aria-describedby="name-error" {...register("name")} />
              <ErrorText id="name-error" message={errors.name?.message} />
            </div>

            <div className="mb-4">
              <label htmlFor="email" className={labelClass}>Email</label>
              <input id="email" type="email" autoComplete="email" className={inputClass}
                aria-invalid={errors.email ? true : undefined} aria-describedby="email-error" {...register("email")} />
              <ErrorText id="email-error" message={errors.email?.message} />
            </div>

            <div className="mb-4">
              <label htmlFor="password" className={labelClass}>Password</label>
              <input id="password" type="password" autoComplete="new-password" className={inputClass}
                aria-invalid={errors.password ? true : undefined} aria-describedby="password-hint password-error" {...register("password")} />
              <p id="password-hint" className="text-gray-600 text-sm mt-1">At least {PASSWORD_MIN_LENGTH} characters.</p>
              <ErrorText id="password-error" message={errors.password?.message} />
            </div>

            {role === "EMPLOYER" && (
              <>
                <h3 className="text-2xl mb-4 mt-6">Your Company</h3>
                <div className="mb-4">
                  <label htmlFor="company_name" className={labelClass}>Company Name</label>
                  <input id="company_name" type="text" autoComplete="organization" className={inputClass}
                    aria-invalid={companyErrors?.name ? true : undefined} aria-describedby="company-name-error" {...register("company.name")} />
                  <ErrorText id="company-name-error" message={companyErrors?.name?.message} />
                </div>
                <div className="mb-4">
                  <label htmlFor="company_description" className={labelClass}>Company Description</label>
                  <textarea id="company_description" rows={3} className={inputClass}
                    {...register("company.description", { setValueAs: blankToUndefined })} />
                </div>
                <div className="mb-4">
                  <label htmlFor="company_website" className={labelClass}>Company Website</label>
                  <input id="company_website" type="url" placeholder="Optional, eg. https://example.com" className={inputClass}
                    aria-describedby="company-website-error" {...register("company.website", { setValueAs: blankToUndefined })} />
                  <ErrorText id="company-website-error" message={companyErrors?.website?.message} />
                </div>
                <div className="mb-4">
                  <label htmlFor="contact_email" className={labelClass}>Contact Email for Applicants</label>
                  <input id="contact_email" type="email" className={inputClass}
                    aria-describedby="contact-email-error" {...register("company.contactEmail", { setValueAs: blankToUndefined })} />
                  <ErrorText id="contact-email-error" message={companyErrors?.contactEmail?.message} />
                </div>
                <div className="mb-4">
                  <label htmlFor="contact_phone" className={labelClass}>Contact Phone</label>
                  <input id="contact_phone" type="tel" placeholder="Optional" className={inputClass}
                    {...register("company.contactPhone", { setValueAs: blankToUndefined })} />
                </div>
              </>
            )}

            {errors.root?.server && (
              <p className="text-red-600 mb-4" role="alert">{errors.root.server.message}</p>
            )}

            <button
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-full w-full disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </button>

            <p className="text-center mt-4 text-gray-600">
              Already registered?{" "}
              <Link to={`/login?returnTo=${encodeURIComponent(returnTo)}`} className="text-indigo-600 hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </section>
  );
};

export default RegisterPage;
