import { getStageMoves, REJECTED, type Applicant, type Stage } from "../types";

interface Props {
  applicant: Applicant;
  /** 서버 응답을 기다리는 중. 낙관적으로 이미 옮겨진 상태다. */
  pending: boolean;
  onMove: (id: string, stage: Stage) => void;
}

export function ApplicantCard({ applicant, pending, onMove }: Props) {
  const { prev, next, canReject } = getStageMoves(applicant.stage);

  return (
    <li className={pending ? "card card--pending" : "card"}>
      <p className="card__name">{applicant.name}</p>
      <p className="card__role">{applicant.role}</p>
      <p className="card__meta">
        <span>지원일 {applicant.appliedAt}</span>
        <span className="card__stage">{applicant.stage}</span>
      </p>

      <div className="card__actions">
        {prev && (
          <button
            type="button"
            className="card__action"
            disabled={pending}
            onClick={() => onMove(applicant.id, prev)}
            aria-label={`${applicant.name} 지원자를 ${prev} 단계로 이동`}
          >
            ← {prev}
          </button>
        )}
        {next && (
          <button
            type="button"
            className="card__action"
            disabled={pending}
            onClick={() => onMove(applicant.id, next)}
            aria-label={`${applicant.name} 지원자를 ${next} 단계로 이동`}
          >
            {next} →
          </button>
        )}
        {canReject && (
          <button
            type="button"
            className="card__action card__action--reject"
            disabled={pending}
            onClick={() => onMove(applicant.id, REJECTED)}
            aria-label={`${applicant.name} 지원자를 불합격 처리`}
          >
            불합격
          </button>
        )}
      </div>
    </li>
  );
}
