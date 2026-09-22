import { useMemo } from "react";
import { STAGES, type Applicant, type Stage } from "../types";
import { Column } from "./Column";

interface Props {
  applicants: Applicant[];
  moving: Record<string, true>;
  onMove: (id: string, stage: Stage) => void;
}

export function Board({ applicants, moving, onMove }: Props) {
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
          moving={moving}
          onMove={onMove}
        />
      ))}
    </div>
  );
}
