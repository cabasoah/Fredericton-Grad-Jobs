import { forwardRef, useState, type ComponentPropsWithoutRef } from "react";
import { LuEye, LuEyeOff } from "react-icons/lu";
import { inputClass } from "@/lib/styles";

// Password input with a show/hide button. Forwards its ref so
// react-hook-form's register() works on it.
const PasswordInput = forwardRef<HTMLInputElement, Omit<ComponentPropsWithoutRef<"input">, "type">>(
  ({ className = "", ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    return (
      <div className="relative">
        <input ref={ref} type={visible ? "text" : "password"} className={`${inputClass} pr-10 ${className}`} {...props} />
        <button
          type="button"
          onClick={() => setVisible((shown) => !shown)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          {visible ? <LuEyeOff aria-hidden /> : <LuEye aria-hidden />}
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";

export default PasswordInput;
