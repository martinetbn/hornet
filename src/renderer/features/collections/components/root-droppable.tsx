// Root droppable components for collection tree

import { useDroppable } from "@dnd-kit/core";

export function RootTopDroppable({ overId }: { overId: string | null }) {
  const { setNodeRef } = useDroppable({
    id: "root-top",
  });

  const isOverRootTop = overId === "root-top";

  return (
    <div ref={setNodeRef} className="relative h-0">
      {isOverRootTop && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary rounded-full z-10" />
      )}
    </div>
  );
}

export function RootDroppable({
  children,
  overId,
}: {
  children: React.ReactNode;
  overId: string | null;
}) {
  const { setNodeRef } = useDroppable({
    id: "root-droppable",
  });

  const isOverRoot = overId === "root-droppable";

  return (
    <div ref={setNodeRef} className="relative min-h-[200px]">
      {isOverRoot && (
        <div className="absolute inset-0 border-2 border-dashed border-primary rounded-md bg-primary/10 z-10" />
      )}
      {children}
    </div>
  );
}
