import type { Applicant, Stage } from "../types";
import { ApplicantCard } from "./ApplicantCard";

interface Props {
  stage: Stage;
  applicants: Applicant[];
  moving: Record<string, true>;
  onMove: (id: string, stage: Stage) => void;
}

export function Column({ stage, applicants, moving, onMove }: Props) {
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
              moving={Boolean(moving[applicant.id])}
              onMove={onMove}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
