import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema } from "@fredericton-grad-jobs/shared";
import { safeReturnTo, useAuth } from "@/auth/AuthContext";
import { ApiError } from "@/lib/api";
import { apiFieldErrors, isFieldOf } from "@/lib/fieldErrors";
import { buttonPrimary, errorTextClass, inputClass, labelClass } from "@/lib/styles";
import AuthCard from "@/components/AuthCard";
import PasswordInput from "@/components/PasswordInput";
import { LuArrowRight } from "react-icons/lu";

const LOGIN_FIELDS = ["email", "password"] as const;

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = safeReturnTo(searchParams.get("returnTo"));

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(LoginSchema), defaultValues: { email: "", password: "" } });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values);
      void navigate(returnTo, { replace: true });
    } catch (err) {
      const fieldErrors = apiFieldErrors(err);
      for (const { path, message } of fieldErrors) {
        if (isFieldOf(LOGIN_FIELDS, path)) setError(path, { message });
      }
      if (fieldErrors.length === 0) {
        setError("root.server", {
          message: err instanceof ApiError ? err.message : "Could not sign in. Please try again.",
        });
      }
    }
  });

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to your application tracker or employer account."
      footer={
        <>
          New here?{" "}
          <Link to={`/register?returnTo=${encodeURIComponent(returnTo)}`} className="font-medium text-indigo-600 hover:text-indigo-700">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={(e) => void onSubmit(e)} noValidate className="space-y-5">
        <div>
          <label htmlFor="email" className={labelClass}>Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className={inputClass}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
          {errors.email && <p id="email-error" className={errorTextClass}>{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="password" className={labelClass}>Password</label>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password")}
          />
          {errors.password && <p id="password-error" className={errorTextClass}>{errors.password.message}</p>}
        </div>

        {errors.root?.server && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
            {errors.root.server.message}
          </p>
        )}

        <button className={`${buttonPrimary} h-11 w-full`} type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Logging in..." : <>Log in <LuArrowRight aria-hidden /></>}
        </button>
      </form>
    </AuthCard>
  );
};

export default LoginPage;
