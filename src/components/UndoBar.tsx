import type { LastMove } from "../state/applicantsReducer";

interface Props {
  lastMove: LastMove;
  onUndo: () => void;
  onDismiss: () => void;
}

/** 무엇을 되돌리는지 보여준다. "되돌리기"만 있으면 무엇이 취소되는지 알 수 없다. */
export function UndoBar({ lastMove, onUndo, onDismiss }: Props) {
  return (
    <div className="undo" role="status">
      <span className="undo__text">
        {lastMove.name} · {lastMove.from} → {lastMove.to}
      </span>
      <button type="button" className="button" onClick={onUndo}>
        되돌리기
      </button>
      <button type="button" className="undo__close" onClick={onDismiss} aria-label="되돌리기 닫기">
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <path d="M3 3 L13 13 M13 3 L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
