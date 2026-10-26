import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema } from "@fredericton-grad-jobs/shared";
import { safeReturnTo, useAuth } from "@/auth/AuthContext";
import { ApiError } from "@/lib/api";
import { apiFieldErrors, isFieldOf } from "@/lib/fieldErrors";

const LOGIN_FIELDS = ["email", "password"] as const;

const inputClass = "border rounded w-full py-2 px-3";
const labelClass = "block text-gray-700 font-bold mb-2";

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
    <section className="bg-indigo-50">
      <div className="container m-auto max-w-md py-24">
        <div className="bg-white px-6 py-8 mb-4 shadow-md rounded-md border m-4 md:m-0">
          <form onSubmit={(e) => void onSubmit(e)} noValidate>
            <h2 className="text-3xl text-center font-semibold mb-6">Sign In</h2>

            <div className="mb-4">
              <label htmlFor="email" className={labelClass}>Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={inputClass}
                aria-invalid={errors.email ? true : undefined}
                aria-describedby={errors.email ? "email-error" : undefined}
                {...register("email")}
              />
              {errors.email && <p id="email-error" className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
            </div>

            <div className="mb-4">
              <label htmlFor="password" className={labelClass}>Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className={inputClass}
                aria-invalid={errors.password ? true : undefined}
                aria-describedby={errors.password ? "password-error" : undefined}
                {...register("password")}
              />
              {errors.password && <p id="password-error" className="text-red-600 text-sm mt-1">{errors.password.message}</p>}
            </div>

            {errors.root?.server && (
              <p className="text-red-600 mb-4" role="alert">{errors.root.server.message}</p>
            )}

            <button
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-full w-full disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing In..." : "Sign In"}
            </button>

            <p className="text-center mt-4 text-gray-600">
              No account?{" "}
              <Link to={`/register?returnTo=${encodeURIComponent(returnTo)}`} className="text-indigo-600 hover:underline">
                Register
              </Link>
            </p>
          </form>
        </div>
      </div>
    </section>
  );
};

export default LoginPage;
