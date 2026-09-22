import { useMemo } from "react";
import { STAGES, type Applicant, type Stage } from "../types";
import type { FocusRequest } from "../state/focusRequest";
import { Column } from "./Column";

interface Props {
  applicants: Applicant[];
  pendingIds: Record<string, unknown>;
  selectedId: string | null;
  focusRequest: FocusRequest;
  onFocusHandled: () => void;
  onMove: (id: string, stage: Stage) => void;
  onSelect: (id: string) => void;
}

export function Board({ applicants, pendingIds, selectedId, focusRequest, onMove, onSelect, onFocusHandled }: Props) {
  // 단계별로 나누는 일은 목록이 바뀔 때만 하면 된다.
  const grouped = useMemo(() => {
    const map = new Map<Stage, Applicant[]>(STAGES.map((stage) => [stage, []]));
    for (const applicant of applicants) {
      map.get(applicant.stage)?.push(applicant);
    }
    return map;
  }, [applicants]);

  return (
    <div className="board">
      {STAGES.map((stage) => (
        <Column
          key={stage}
          stage={stage}
          applicants={grouped.get(stage) ?? []}
          pendingIds={pendingIds}
          selectedId={selectedId}
          focusRequest={focusRequest}
          onFocusHandled={onFocusHandled}
          onMove={onMove}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
