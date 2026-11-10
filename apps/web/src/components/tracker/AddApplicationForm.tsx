import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { APPLICATION_STAGE_LABELS, APPLICATION_STAGES, ExternalApplicationSchema } from "@fredericton-grad-jobs/shared";
import { useCreateApplication } from "@/lib/queries/applications";
import { buttonGhost, buttonPrimary, card, errorTextClass, hintClass, inputClass, labelClass, selectClass, textareaClass } from "@/lib/styles";

type AddApplicationFormProps = {
  onDone: () => void;
};

// Optional inputs send null (not "") when left blank.
const blankToNull = (value: unknown) => (typeof value === "string" && value.trim() === "" ? null : value);

const FieldError = ({ id, message }: { id: string; message?: string }) =>
  message ? <p id={id} className={errorTextClass}>{message}</p> : null;

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
      className={`${card} mb-6 p-6`}
    >
      <h2 id="add-application-heading" className="text-lg font-semibold text-slate-900">Add an application from elsewhere</h2>
      <p className="mb-5 mt-1 text-sm text-slate-500">For jobs you found on another site, through a referral or at a career fair.</p>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
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
          <select id="add-stage" className={selectClass} {...register("stage")}>
            {APPLICATION_STAGES.map((stage) => (
              <option key={stage} value={stage}>{APPLICATION_STAGE_LABELS[stage]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="add-applied" className={labelClass}>Applied on (optional)</label>
          <input id="add-applied" type="date" className={inputClass} {...register("appliedAt", { setValueAs: blankToNull })} />
          <p className={hintClass}>Left blank, today is used once the stage is Applied or later.</p>
        </div>
        <div>
          <label htmlFor="add-follow-up" className={labelClass}>Next follow-up (optional)</label>
          <input id="add-follow-up" type="date" className={inputClass} {...register("nextFollowUpAt", { setValueAs: blankToNull })} />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="add-notes" className={labelClass}>Notes (optional)</label>
          <textarea id="add-notes" rows={3} className={textareaClass} {...register("notes")} />
        </div>
      </div>
      <div className="mt-6 flex gap-3">
        <button type="submit" disabled={isSubmitting} className={buttonPrimary}>
          {isSubmitting ? "Adding..." : "Add application"}
        </button>
        <button type="button" onClick={onDone} className={buttonGhost}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export default AddApplicationForm;
