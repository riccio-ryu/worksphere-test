import { useEffect, useRef } from "react";
import { getStageMoves, REJECTED, type Applicant, type Stage } from "../types";
import type { FocusRequest } from "../state/focusRequest";

interface Props {
  applicant: Applicant;
  /** 서버 응답을 기다리는 중. 낙관적으로 이미 옮겨진 상태다. */
  pending: boolean;
  selected: boolean;
  focusRequest: FocusRequest;
  onFocusHandled: () => void;
  onMove: (id: string, stage: Stage) => void;
  onSelect: (id: string) => void;
}

export function ApplicantCard({ applicant, pending, selected, focusRequest, onMove, onSelect, onFocusHandled }: Props) {
  const openRef = useRef<HTMLButtonElement>(null);

  // 단계를 옮기면 카드가 다른 컬럼으로 옮겨가며 DOM 에서 사라졌다 다시 생긴다.
  // 그대로 두면 초점이 body 로 떨어져, 키보드 사용자는 Tab 을 처음부터 다시 눌러야 한다.
  // 요청을 쓰고 나면 비운다. 남겨 두면 이 카드가 다시 마운트될 때마다
  // 지난 요청으로 초점을 가져가, 상세 패널이 열려 있어도 뒤쪽 카드가 초점을 빼앗는다.
  useEffect(() => {
    if (focusRequest.id !== applicant.id) return;
    openRef.current?.focus();
    onFocusHandled();
  }, [focusRequest, applicant.id, onFocusHandled]);

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
        ref={openRef}
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
