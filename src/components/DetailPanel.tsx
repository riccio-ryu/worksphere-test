import { useEffect, useRef } from "react";
import { getStageMoves, REJECTED, type Applicant, type Stage } from "../types";

interface Props {
  applicant: Applicant;
  pending: boolean;
  onMove: (id: string, stage: Stage) => void;
  onClose: () => void;
}

const FIELDS: Array<[string, (a: Applicant) => string]> = [
  ["현재 단계", (a) => a.stage],
  ["직무", (a) => a.role],
  ["경력", (a) => `${a.experienceYears}년`],
  ["지원일", (a) => a.appliedAt],
  ["지원 경로", (a) => a.source],
  ["이메일", (a) => a.email],
  ["연락처", (a) => a.phone],
];

const FOCUSABLE = "button:not(:disabled), [href], input, select, textarea, [tabindex]:not([tabindex='-1'])";

export function DetailPanel({ applicant, pending, onMove, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const { prev, next, canReject } = getStageMoves(applicant.stage);

  // 패널이 열려 있는 동안에는 보드 쪽으로 초점을 넘기지 않는다.
  // 화면은 패널이 덮고 있는데 초점만 뒤쪽 카드에 가 있으면 어디를 조작하는지 알 수 없다.
  const moveAndStay = (id: string, stage: Stage) => {
    onMove(id, stage);
    closeRef.current?.focus();
  };

  // 패널이 열리면 닫기 버튼으로 초점을 옮긴다.
  // 닫을 때 초점을 되돌리는 일은 App 이 맡는다. 패널에서 단계를 옮기면 그 카드가
  // 다른 컬럼으로 이동하며 열었던 버튼 자체가 사라지므로, 요소가 아니라 카드 id 로 되돌려야 한다.
  useEffect(() => {
    closeRef.current?.focus();
  }, [applicant.id]);

  // 배경을 덮는 형태라 Tab 이 뒤쪽 보드로 새어 나가면 안 된다.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;

      const items = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      // 버튼이 눌린 뒤 disabled 가 되면 초점이 body 로 떨어진다.
      // 그 상태로 Tab 을 누르면 패널 밖으로 새므로 다시 안으로 끌어온다.
      const outside = !(active instanceof HTMLElement) || !panelRef.current.contains(active);

      if (outside) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <>
      {/* 바깥을 눌러 닫는 통로. 보조기기에는 의미가 없으므로 감춘다. */}
      <div className="panel__backdrop" onClick={onClose} aria-hidden="true" />

      <div
        className="panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="panel-title"
        ref={panelRef}
      >
        <header className="panel__header">
          <h2 className="panel__title" id="panel-title">
            {applicant.name}
          </h2>
          <button type="button" className="panel__close" ref={closeRef} onClick={onClose} aria-label="상세 닫기">
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <path
                d="M3 3 L13 13 M13 3 L3 13"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>

        <dl className="panel__fields">
          {FIELDS.map(([label, read]) => (
            <div className="panel__row" key={label}>
              <dt className="panel__label">{label}</dt>
              <dd className="panel__value">{read(applicant)}</dd>
            </div>
          ))}
        </dl>

        <p className="panel__summary">{applicant.summary}</p>

        <div className="panel__actions">
          <span className="panel__actions-label">단계 이동</span>
          <div className="panel__buttons">
            {prev && (
              <button type="button" className="card__action" disabled={pending} onClick={() => moveAndStay(applicant.id, prev)}>
                ← {prev}
              </button>
            )}
            {next && (
              <button type="button" className="card__action" disabled={pending} onClick={() => moveAndStay(applicant.id, next)}>
                {next} →
              </button>
            )}
            {canReject && (
              <button
                type="button"
                className="card__action card__action--reject"
                disabled={pending}
                onClick={() => moveAndStay(applicant.id, REJECTED)}
              >
                불합격
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
