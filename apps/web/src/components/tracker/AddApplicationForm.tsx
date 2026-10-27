import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { APPLICATION_STAGE_LABELS, APPLICATION_STAGES, ExternalApplicationSchema } from "@fredericton-grad-jobs/shared";
import { useCreateApplication } from "@/lib/queries/applications";

type AddApplicationFormProps = {
  onDone: () => void;
};

const inputClass = "border rounded w-full py-2 px-3";
const labelClass = "block text-gray-700 text-sm font-bold mb-1";

// Optional inputs send null (not "") when left blank.
const blankToNull = (value: unknown) => (typeof value === "string" && value.trim() === "" ? null : value);

const FieldError = ({ id, message }: { id: string; message?: string }) =>
  message ? <p id={id} className="text-red-600 text-sm mt-1">{message}</p> : null;

// For applications to jobs found outside this board.
const AddApplicationForm = ({ onDone }: AddApplicationFormProps) => {
  const createApplication = useCreateApplication();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(ExternalApplicationSchema),
    defaultValues: { companyName: "", roleTitle: "", url: null, stage: "APPLIED", appliedAt: null, nextFollowUpAt: null, notes: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    await createApplication.mutateAsync(values);
    onDone();
  });

  return (
    <form
      onSubmit={(e) => void onSubmit(e).catch(() => undefined)}
      noValidate
      aria-labelledby="add-application-heading"
      className="bg-white rounded-xl shadow-md p-6 mb-6"
    >
      <h2 id="add-application-heading" className="text-xl font-bold mb-4">Add an application from elsewhere</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="add-company" className={labelClass}>Company</label>
          <input id="add-company" className={inputClass} aria-invalid={errors.companyName ? true : undefined} aria-describedby="add-company-error" {...register("companyName")} />
          <FieldError id="add-company-error" message={errors.companyName?.message} />
        </div>
        <div>
          <label htmlFor="add-role" className={labelClass}>Role</label>
          <input id="add-role" className={inputClass} aria-invalid={errors.roleTitle ? true : undefined} aria-describedby="add-role-error" {...register("roleTitle")} />
          <FieldError id="add-role-error" message={errors.roleTitle?.message} />
        </div>
        <div>
          <label htmlFor="add-url" className={labelClass}>Posting URL (optional)</label>
          <input id="add-url" type="url" placeholder="https://..." className={inputClass} aria-invalid={errors.url ? true : undefined} aria-describedby="add-url-error" {...register("url", { setValueAs: blankToNull })} />
          <FieldError id="add-url-error" message={errors.url?.message} />
        </div>
        <div>
          <label htmlFor="add-stage" className={labelClass}>Stage</label>
          <select id="add-stage" className={inputClass} {...register("stage")}>
            {APPLICATION_STAGES.map((stage) => (
              <option key={stage} value={stage}>{APPLICATION_STAGE_LABELS[stage]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="add-applied" className={labelClass}>Applied on (optional)</label>
          <input id="add-applied" type="date" className={inputClass} {...register("appliedAt", { setValueAs: blankToNull })} />
          <p className="text-gray-600 text-xs mt-1">Left blank, today is used once the stage is Applied or later.</p>
        </div>
        <div>
          <label htmlFor="add-follow-up" className={labelClass}>Next follow-up (optional)</label>
          <input id="add-follow-up" type="date" className={inputClass} {...register("nextFollowUpAt", { setValueAs: blankToNull })} />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="add-notes" className={labelClass}>Notes (optional)</label>
          <textarea id="add-notes" rows={3} className={inputClass} {...register("notes")} />
        </div>
      </div>
      <div className="flex gap-3 mt-4">
        <button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50">
          {isSubmitting ? "Adding..." : "Add application"}
        </button>
        <button type="button" onClick={onDone} className="py-2 px-4 rounded-lg text-gray-700 hover:bg-gray-100">
          Cancel
        </button>
      </div>
    </form>
  );
};

export default AddApplicationForm;
