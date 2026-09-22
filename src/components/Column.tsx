import type { Applicant, Stage } from "../types";
import type { FocusRequest } from "../state/focusRequest";
import { ApplicantCard } from "./ApplicantCard";
import { CARD_SLOT_HEIGHT, useVisibleRange } from "./useVisibleRange";

interface Props {
  stage: Stage;
  applicants: Applicant[];
  pendingIds: Record<string, unknown>;
  selectedId: string | null;
  focusRequest: FocusRequest;
  onMove: (id: string, stage: Stage) => void;
  onSelect: (id: string) => void;
  onFocusHandled: () => void;
}

export function Column({
  stage,
  applicants,
  pendingIds,
  selectedId,
  focusRequest,
  onMove,
  onSelect,
  onFocusHandled,
}: Props) {
  const headingId = `column-heading-${stage}`;
  const { ref, range } = useVisibleRange({
    itemHeight: CARD_SLOT_HEIGHT,
    count: applicants.length,
  });

  const visible = applicants.slice(range.start, range.end);

  return (
    <section className="column" aria-labelledby={headingId}>
      <h2 className="column__heading" id={headingId}>
        {stage}
        <span className="column__count">{applicants.length}</span>
      </h2>

      {applicants.length === 0 ? (
        <p className="column__empty">해당 단계의 지원자가 없습니다</p>
      ) : (
        <ul
          className="column__list"
          ref={ref as React.RefObject<HTMLUListElement>}
          // 전체 높이를 미리 잡아 두면 스크롤바가 실제 건수를 반영한다.
          style={{ height: applicants.length * CARD_SLOT_HEIGHT }}
        >
          {/* 보이지 않는 앞뒤 구간은 빈 공간으로만 차지한다. */}
          <li className="column__spacer" style={{ height: range.start * CARD_SLOT_HEIGHT }} aria-hidden="true" />
          {visible.map((applicant) => (
            <ApplicantCard
              key={applicant.id}
              applicant={applicant}
              pending={Boolean(pendingIds[applicant.id])}
              selected={selectedId === applicant.id}
              focusRequest={focusRequest}
              onMove={onMove}
              onSelect={onSelect}
              onFocusHandled={onFocusHandled}
            />
          ))}
          <li
            className="column__spacer"
            style={{ height: (applicants.length - range.end) * CARD_SLOT_HEIGHT }}
            aria-hidden="true"
          />
        </ul>
      )}
    </section>
  );
}
