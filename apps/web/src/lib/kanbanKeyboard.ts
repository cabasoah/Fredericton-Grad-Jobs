import type { KeyboardCoordinateGetter } from "@dnd-kit/core";

type Rect = { left: number; top: number; width: number };

// The nearest column whose centre is to the left/right of `centerX`.
export const adjacentColumn = <T extends Rect>(columns: T[], centerX: number, direction: "left" | "right") => {
  const sorted = [...columns].sort((a, b) => a.left - b.left);
  const middle = (rect: Rect) => rect.left + rect.width / 2;
  return direction === "right"
    ? sorted.find((rect) => middle(rect) > centerX + 1)
    : sorted.reverse().find((rect) => middle(rect) < centerX - 1);
};

// Keyboard dragging for the board: Left/Right jump a whole column (the
// default sensor moves 25 px per key press). Space/Enter pick up and drop,
// Escape cancels; those are handled by dnd-kit's KeyboardSensor.
export const columnCoordinateGetter: KeyboardCoordinateGetter = (event, { context, currentCoordinates }) => {
  const direction = event.code === "ArrowRight" ? "right" : event.code === "ArrowLeft" ? "left" : null;
  if (!direction) return undefined;
  const { collisionRect, droppableRects } = context;
  if (!collisionRect) return undefined;
  event.preventDefault();
  const target = adjacentColumn([...droppableRects.values()], collisionRect.left + collisionRect.width / 2, direction);
  if (!target) return currentCoordinates;
  return {
    x: target.left + (target.width - collisionRect.width) / 2,
    // Just below the column heading, so the card is over the column.
    y: target.top + 56,
  };
};
