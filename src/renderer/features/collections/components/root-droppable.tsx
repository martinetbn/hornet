// Root droppable components for collection tree

import { useDroppable } from '@dnd-kit/core';

export function RootTopDroppable({ overId }: { overId: string | null }) {
  const { setNodeRef } = useDroppable({
    id: 'root-top',
  });

  const isOverRootTop = overId === 'root-top';

  return (
    <div ref={setNodeRef} className="relative h-6 -mb-2">
      {isOverRootTop && (
        <div className="absolute top-2 left-0 right-0 h-0.5 bg-primary rounded-full z-10" />
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
    id: 'root-droppable',
  });

  const isOverRoot = overId === 'root-droppable';

  return (
    <div ref={setNodeRef} className="relative min-h-[100px]">
      {isOverRoot && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary rounded-full z-10" />
      )}
      {children}
      {isOverRoot && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full z-10" />
      )}
    </div>
  );
}
