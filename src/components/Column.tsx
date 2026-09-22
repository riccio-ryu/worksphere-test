import type { Applicant, Stage } from "../types";
import type { FocusRequest } from "../state/focusRequest";
import { ApplicantCard } from "./ApplicantCard";

interface Props {
  stage: Stage;
  applicants: Applicant[];
  pendingIds: Record<string, unknown>;
  selectedId: string | null;
  focusRequest: FocusRequest;
  onFocusHandled: () => void;
  onMove: (id: string, stage: Stage) => void;
  onSelect: (id: string) => void;
}

export function Column({ stage, applicants, pendingIds, selectedId, focusRequest, onMove, onSelect, onFocusHandled }: Props) {
  const headingId = `column-heading-${stage}`;

  return (
    <section className="column" aria-labelledby={headingId}>
      <h2 className="column__heading" id={headingId}>
        {stage}
        <span className="column__count">{applicants.length}</span>
      </h2>

      {applicants.length === 0 ? (
        <p className="column__empty">해당 단계의 지원자가 없습니다</p>
      ) : (
        <ul className="column__list">
          {applicants.map((applicant) => (
            <ApplicantCard
              key={applicant.id}
              applicant={applicant}
              pending={Boolean(pendingIds[applicant.id])}
              selected={selectedId === applicant.id}
              focusRequest={focusRequest}
              onFocusHandled={onFocusHandled}
              onMove={onMove}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
