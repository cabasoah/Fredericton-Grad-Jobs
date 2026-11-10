import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { LuCalendarClock, LuGripVertical } from "react-icons/lu";
import {
  APPLICATION_STAGE_LABELS,
  APPLICATION_STAGES,
  ApplicationStageSchema,
  type Application,
  type ApplicationStage,
} from "@fredericton-grad-jobs/shared";
import { columnCoordinateGetter } from "@/lib/kanbanKeyboard";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { STAGE_STYLES } from "@/lib/stageStyles";
import CompanyAvatar from "../CompanyAvatar";

type KanbanBoardProps = {
  applications: Application[];
  onMove: (application: Application, stage: ApplicationStage) => void;
  onOpen: (application: Application) => void;
};

const stageOf = (id: UniqueIdentifier | undefined) => {
  const parsed = ApplicationStageSchema.safeParse(id);
  return parsed.success ? parsed.data : undefined;
};

const CardBody = ({ application }: { application: Application }) => (
  <>
    <div className="flex items-start gap-2.5">
      <CompanyAvatar name={application.companyName} size="sm" />
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-slate-500">{application.companyName}</p>
        <p className="text-sm font-semibold leading-snug text-slate-900">{application.roleTitle}</p>
      </div>
    </div>
    {application.nextFollowUpAt && (
      <p className="mt-2.5 inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-800">
        <LuCalendarClock aria-hidden /> Follow up {application.nextFollowUpAt.slice(0, 10)}
      </p>
    )}
    <p className="mt-2 text-xs text-slate-400">Updated {formatRelativeTime(application.updatedAt)}</p>
  </>
);

const Card = ({ application, onOpen }: { application: Application; onOpen: KanbanBoardProps["onOpen"] }) => {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({
    id: application.id,
    data: { stage: application.stage },
  });
  return (
    <li
      ref={setNodeRef}
      className={`flex rounded-xl border border-slate-200 bg-white shadow-card transition hover:border-slate-300 hover:shadow-card-hover ${isDragging ? "opacity-40" : ""}`}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`Move ${application.roleTitle} at ${application.companyName}`}
        className="px-1.5 text-slate-300 hover:text-slate-600 cursor-grab active:cursor-grabbing rounded-l-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 touch-none"
      >
        <LuGripVertical aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => onOpen(application)}
        data-application-id={application.id}
        className="min-w-0 flex-1 rounded-r-xl p-3 pl-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        <CardBody application={application} />
      </button>
    </li>
  );
};

const Column = ({
  stage,
  applications,
  onOpen,
}: {
  stage: ApplicationStage;
  applications: Application[];
  onOpen: KanbanBoardProps["onOpen"];
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const headingId = `column-${stage}`;
  return (
    <section
      ref={setNodeRef}
      aria-labelledby={headingId}
      className={`flex w-72 shrink-0 snap-start flex-col rounded-2xl border p-3 transition-colors ${
        isOver ? "border-indigo-300 bg-indigo-50 ring-2 ring-indigo-400" : "border-slate-200 bg-slate-50/80"
      }`}
    >
      <h2 id={headingId} className="mb-3 flex items-center gap-2 px-1 text-sm font-semibold text-slate-800">
        <span aria-hidden className={`h-2 w-2 rounded-full ${STAGE_STYLES[stage].dot}`} />
        {APPLICATION_STAGE_LABELS[stage]}
        <span className="ml-auto rounded-full border border-slate-200 bg-white px-2 text-xs font-medium text-slate-600" aria-label={`${applications.length} applications`}>
          {applications.length}
        </span>
      </h2>
      <ul className="flex min-h-24 flex-col gap-2">
        {applications.map((application) => (
          <Card key={application.id} application={application} onOpen={onOpen} />
        ))}
      </ul>
    </section>
  );
};

// One column per stage; drag a card (or its handle with the keyboard:
// Space to pick up, Left/Right to change column, Space to drop, Escape to
// cancel) to change its stage.
const KanbanBoard = ({ applications, onMove, onOpen }: KanbanBoardProps) => {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const sensors = useSensors(
    // A small distance threshold keeps clicks on the handle from starting a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: columnCoordinateGetter }),
  );

  const byId = new Map(applications.map((application) => [application.id, application]));
  const titleOf = (id: UniqueIdentifier) => {
    const application = byId.get(String(id));
    return application ? `${application.roleTitle} at ${application.companyName}` : "Application";
  };
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${titleOf(active.id)}. Use the left and right arrow keys to choose a stage.`,
    onDragOver: ({ active, over }) => {
      const stage = stageOf(over?.id);
      return stage ? `${titleOf(active.id)} is over ${APPLICATION_STAGE_LABELS[stage]}.` : undefined;
    },
    onDragEnd: ({ active, over }) => {
      const stage = stageOf(over?.id);
      return stage ? `${titleOf(active.id)} moved to ${APPLICATION_STAGE_LABELS[stage]}.` : `${titleOf(active.id)} was dropped outside the board.`;
    },
    onDragCancel: ({ active }) => `Moving ${titleOf(active.id)} was cancelled.`,
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    const application = byId.get(String(active.id));
    const stage = stageOf(over?.id);
    if (application && stage && stage !== application.stage) onMove(application, stage);
  };

  const active = activeId === null ? undefined : byId.get(String(activeId));

  return (
    <DndContext
      sensors={sensors}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable:
            "To move this application, press Space. Use the left and right arrow keys to choose a stage, then press Space to drop it, or Escape to cancel.",
        },
      }}
      onDragStart={({ active: started }) => setActiveId(started.id)}
      onDragCancel={() => setActiveId(null)}
      onDragEnd={onDragEnd}
    >
      <div className="flex snap-x gap-4 overflow-x-auto pb-4">
        {APPLICATION_STAGES.map((stage) => (
          <Column
            key={stage}
            stage={stage}
            applications={applications.filter((application) => application.stage === stage)}
            onOpen={onOpen}
          />
        ))}
      </div>
      {/* Rendered above everything, so the card is not clipped by the scrolling board. */}
      <DragOverlay>
        {active ? (
          <div className="w-68 rotate-2 rounded-xl border border-indigo-300 bg-white p-3 shadow-overlay">
            <CardBody application={active} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default KanbanBoard;
