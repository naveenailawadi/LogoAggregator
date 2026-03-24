import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import LogoCard from "./LogoCard.jsx";

export default function LogoGrid({ logos, setLogos }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setLogos((prev) => {
        const oldIndex = prev.findIndex((l) => l.id === active.id);
        const newIndex = prev.findIndex((l) => l.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const toggleSelect = (id) => {
    setLogos((prev) =>
      prev.map((l) => (l.id === id ? { ...l, selected: !l.selected } : l))
    );
  };

  const changeName = (id, name) => {
    setLogos((prev) =>
      prev.map((l) => (l.id === id ? { ...l, displayName: name } : l))
    );
  };

  const allSelected = logos.every((l) => l.selected);
  const selectedCount = logos.filter((l) => l.selected).length;
  const failedCount = logos.filter((l) => l.status === "failed").length;

  const selectAll = () => setLogos((prev) => prev.map((l) => ({ ...l, selected: true })));
  const deselectAll = () => setLogos((prev) => prev.map((l) => ({ ...l, selected: false })));

  return (
    <div className="logo-grid-container">
      <div className="grid-toolbar">
        <span className="grid-count">
          {logos.length} logo{logos.length !== 1 ? "s" : ""}
          {failedCount > 0 && (
            <span className="failed-count"> · {failedCount} failed</span>
          )}
        </span>
        <div className="grid-actions">
          <button className="btn-secondary btn-sm" onClick={selectAll}>
            Select all
          </button>
          <button className="btn-secondary btn-sm" onClick={deselectAll}>
            Deselect all
          </button>
          <span className="selected-count">{selectedCount} selected</span>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={logos.map((l) => l.id)} strategy={rectSortingStrategy}>
          <div className="logo-grid">
            {logos.map((logo) => (
              <LogoCard
                key={logo.id}
                logo={logo}
                onToggleSelect={toggleSelect}
                onNameChange={changeName}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
