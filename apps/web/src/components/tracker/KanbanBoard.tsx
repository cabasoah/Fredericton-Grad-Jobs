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
import { FaGripVertical } from "react-icons/fa";
import {
  APPLICATION_STAGE_LABELS,
  APPLICATION_STAGES,
  ApplicationStageSchema,
  type Application,
  type ApplicationStage,
} from "@fredericton-grad-jobs/shared";
import { columnCoordinateGetter } from "@/lib/kanbanKeyboard";
import { formatRelativeTime } from "@/lib/formatRelativeTime";

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
    <p className="font-semibold text-gray-900 leading-snug">{application.roleTitle}</p>
    <p className="text-sm text-gray-600">{application.companyName}</p>
    {application.nextFollowUpAt && (
      <p className="text-xs text-indigo-700 mt-1">Follow up {application.nextFollowUpAt.slice(0, 10)}</p>
    )}
    <p className="text-xs text-gray-500 mt-1">Updated {formatRelativeTime(application.updatedAt)}</p>
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
      className={`flex gap-1 bg-white rounded-lg shadow-sm border border-gray-200 ${isDragging ? "opacity-40" : ""}`}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`Move ${application.roleTitle} at ${application.companyName}`}
        className="px-1 text-gray-400 hover:text-gray-700 cursor-grab active:cursor-grabbing rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 touch-none"
      >
        <FaGripVertical aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => onOpen(application)}
        data-application-id={application.id}
        className="flex-1 text-left p-3 pl-1 rounded-r-lg hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
      className={`flex flex-col w-64 shrink-0 rounded-xl p-3 ${isOver ? "bg-indigo-100 ring-2 ring-indigo-400" : "bg-gray-100"}`}
    >
      <h2 id={headingId} className="flex items-center justify-between font-bold text-gray-800 mb-3">
        {APPLICATION_STAGE_LABELS[stage]}
        <span className="text-sm font-semibold text-gray-600 bg-white rounded-full px-2" aria-label={`${applications.length} applications`}>
          {applications.length}
        </span>
      </h2>
      <ul className="flex flex-col gap-2 min-h-24">
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
      <div className="flex gap-4 overflow-x-auto pb-4">
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
          <div className="w-60 bg-white rounded-lg shadow-lg border border-indigo-300 p-3 rotate-2">
            <CardBody application={active} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default KanbanBoard;
