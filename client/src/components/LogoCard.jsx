import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function LogoCard({ logo, onToggleSelect, onNameChange }) {
  const [imgError, setImgError] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: logo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const sourceLabel = {
    "brandfetch-cdn": "Brandfetch",
    "brandfetch-api": "Brandfetch API",
    clearbit: "Clearbit",
    "google-favicon": "Favicon",
  }[logo.source] || logo.source;

  const failed = logo.status === "failed" || (!logo.base64 && !logo.logoUrl);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`logo-card ${!logo.selected ? "logo-card--deselected" : ""} ${failed ? "logo-card--failed" : ""} ${isDragging ? "logo-card--dragging" : ""}`}
    >
      {/* Drag handle */}
      <div className="drag-handle" {...attributes} {...listeners} title="Drag to reorder">
        ⠿
      </div>

      {/* Selection checkbox */}
      <input
        type="checkbox"
        className="logo-card-checkbox"
        checked={logo.selected}
        onChange={() => onToggleSelect(logo.id)}
        title={logo.selected ? "Deselect" : "Select"}
      />

      {/* Logo image */}
      <div className="logo-img-wrap">
        {failed || imgError ? (
          <div className="logo-placeholder">
            <span className="logo-placeholder-icon">?</span>
          </div>
        ) : (
          <img
            src={logo.base64 || logo.logoUrl}
            alt={logo.displayName}
            className="logo-img"
            onError={() => setImgError(true)}
            draggable={false}
          />
        )}
      </div>

      {/* Source badge */}
      {logo.source && (
        <div className={`source-badge source-badge--${logo.status}`}>
          {sourceLabel}
        </div>
      )}

      {/* Editable display name */}
      <input
        type="text"
        className="logo-name-input"
        value={logo.displayName || ""}
        onChange={(e) => onNameChange(logo.id, e.target.value)}
        placeholder="Company name"
        title="Edit display name"
      />

      <div className="logo-domain">{logo.domain}</div>
    </div>
  );
}
