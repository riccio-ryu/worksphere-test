import type { LastMove } from "../state/applicantsReducer";

interface Props {
  lastMove: LastMove;
  onUndo: () => void;
}

/** 무엇을 되돌리는지 보여준다. "되돌리기"만 있으면 무엇이 취소되는지 알 수 없다. */
export function UndoBar({ lastMove, onUndo }: Props) {
  return (
    <div className="undo" role="status">
      <span className="undo__text">
        {lastMove.name} · {lastMove.from} → {lastMove.to}
      </span>
      <button type="button" className="button" onClick={onUndo}>
        되돌리기
      </button>
    </div>
  );
}
