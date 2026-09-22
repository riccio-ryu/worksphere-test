import { getStageMoves, REJECTED, type Applicant, type Stage } from "../types";

interface Props {
  applicant: Applicant;
  /** 서버 응답을 기다리는 중. 낙관적으로 이미 옮겨진 상태다. */
  pending: boolean;
  selected: boolean;
  onMove: (id: string, stage: Stage) => void;
  onSelect: (id: string) => void;
}

export function ApplicantCard({ applicant, pending, selected, onMove, onSelect }: Props) {
  const { prev, next, canReject } = getStageMoves(applicant.stage);
  const className = ["card", pending && "card--pending", selected && "card--selected"]
    .filter(Boolean)
    .join(" ");

  return (
    <li className={className}>
      {/* 카드 본문 자체를 버튼으로 둔다. li 에 클릭을 걸면 키보드로 열 수 없다. */}
      <button
        type="button"
        className="card__open"
        aria-expanded={selected}
        onClick={() => onSelect(applicant.id)}
      >
        <span className="card__name">{applicant.name}</span>
        <span className="card__role">{applicant.role}</span>
        <span className="card__meta">
          <span>지원일 {applicant.appliedAt}</span>
          <span className="card__stage">{applicant.stage}</span>
        </span>
      </button>

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
