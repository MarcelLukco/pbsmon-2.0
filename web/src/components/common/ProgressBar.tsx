import type { ReactNode } from "react";

interface ProgressBarProps {
  percent: number;
  label: string;
  value: number | string;
  color: string | ((percent: number) => string);
  icon?: ReactNode;
}

export function ProgressBar({
  percent,
  label,
  value,
  color,
  icon,
}: ProgressBarProps) {
  // Clamp percent between 0 and 100
  const clampedPercent = Math.max(0, Math.min(100, percent));

  const colorHex = typeof color === "string" ? color : color(clampedPercent);

  const percentText = `${Math.round(clampedPercent)}%`;
  const fillWidth = `${clampedPercent}%`;
  const showTextInCenter = clampedPercent < 35;

  return (
    <div className="w-full">
      {/* Label row */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-900">{label}</span>
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium text-gray-900">{value}</span>
          {icon && (
            <span className="w-[14px] h-[14px] flex items-center justify-center">
              {icon}
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div
        className={`relative w-full h-[21px] border rounded-[4px] overflow-hidden`}
        style={{ borderColor: colorHex }}
      >
        {/* Filled portion */}
        <div
          className={`h-full transition-all duration-300 ${
            !showTextInCenter ? "flex items-center justify-center" : ""
          }`}
          style={{ width: fillWidth, backgroundColor: colorHex }}
        >
          {!showTextInCenter && (
            <span className="text-sm font-medium text-white">
              {percentText}
            </span>
          )}
        </div>
        {/* Text in center for low percentages */}
        {showTextInCenter && (
          <span
            className={`absolute inset-0 flex items-center justify-center text-sm font-medium`}
            style={{ color: colorHex }}
          >
            {percentText}
          </span>
        )}
      </div>
    </div>
  );
}
