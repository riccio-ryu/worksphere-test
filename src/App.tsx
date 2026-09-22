import { useCallback, useDeferredValue, useMemo, useState } from "react";
import { Board } from "./components/Board";
import { ALL_ROLES, BoardFilters } from "./components/BoardFilters";
import { BoardEmpty, BoardError, BoardSkeleton } from "./components/BoardStates";
import { DemoControls } from "./components/DemoControls";
import { DetailPanel } from "./components/DetailPanel";
import { Toast } from "./components/Toast";
import { UndoBar } from "./components/UndoBar";
import { NO_FOCUS_REQUEST, type FocusRequest } from "./state/focusRequest";
import { useApplicants } from "./state/useApplicants";
import "./components/board.css";

function App() {
  const { state, move, undo, reload, dismissToast } = useApplicants();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<string>(ALL_ROLES);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusRequest, setFocusRequest] = useState<FocusRequest>(NO_FOCUS_REQUEST);

  // 패널을 닫으면 열었던 카드로 초점을 되돌린다. 되돌리지 않으면 body 로 떨어져
  // 키보드 사용자가 처음부터 Tab 을 다시 눌러야 한다.
  const closePanel = () => {
    const opened = selectedId;
    setSelectedId(null);
    if (opened) setFocusRequest((current) => ({ id: opened, seq: current.seq + 1 }));
  };

  const clearFocusRequest = useCallback(() => {
    setFocusRequest((current) => (current.id === null ? current : { id: null, seq: current.seq }));
  }, []);

  // 카드가 다른 컬럼으로 옮겨가면 DOM 에서 사라졌다 다시 생기므로 초점을 되돌려 준다.
  const moveFromBoard = (id: string, stage: Parameters<typeof move>[1]) => {
    void move(id, stage);
    setFocusRequest((current) => ({ id, seq: current.seq + 1 }));
  };

  // 타이핑은 즉시 반영하고 1,000건 재계산은 한 박자 늦춘다.
  // 입력 값과 목록 계산을 같은 렌더에 묶으면 글자마다 보드 전체가 다시 그려져 입력이 끊긴다.
  const deferredQuery = useDeferredValue(query);

  const applicants = useMemo(
    () => state.order.map((id) => state.byId[id]),
    [state.order, state.byId],
  );

  const visible = useMemo(() => {
    const keyword = deferredQuery.trim().toLowerCase();
    if (!keyword && role === ALL_ROLES) return applicants;

    return applicants.filter((applicant) => {
      if (role !== ALL_ROLES && applicant.role !== role) return false;
      return !keyword || applicant.name.toLowerCase().includes(keyword);
    });
  }, [applicants, deferredQuery, role]);

  const filtering = deferredQuery.trim() !== "" || role !== ALL_ROLES;
  // 선택된 카드는 byId 에서 다시 읽는다. 단계가 바뀌면 패널 내용도 따라 바뀐다.
  const selected = selectedId ? (state.byId[selectedId] ?? null) : null;

  return (
    <main className="app">
      <h1 className="app__title">채용 파이프라인 보드</h1>

      <DemoControls onReload={reload} />

      {state.status === "ready" && (
        <BoardFilters
          query={query}
          role={role}
          total={applicants.length}
          matched={visible.length}
          onQueryChange={setQuery}
          onRoleChange={setRole}
        />
      )}

      {state.status === "loading" && <BoardSkeleton />}
      {state.status === "error" && (
        <BoardError message={state.error ?? "알 수 없는 오류가 발생했습니다."} onRetry={reload} />
      )}
      {state.status === "ready" &&
        (visible.length === 0 ? (
          <BoardEmpty filtered={filtering} />
        ) : (
          <Board
            applicants={visible}
            pendingIds={state.pending}
            selectedId={selectedId}
            focusRequest={focusRequest}
            onFocusHandled={clearFocusRequest}
            onMove={moveFromBoard}
            onSelect={(id) => (id === selectedId ? closePanel() : setSelectedId(id))}
          />
        ))}

      {selected && (
        <DetailPanel
          applicant={selected}
          pending={Boolean(state.pending[selected.id])}
          onMove={move}
          onClose={closePanel}
        />
      )}

      {state.lastMove && (
        <UndoBar
          lastMove={state.lastMove}
          onUndo={() => {
            const target = state.lastMove;
            void undo();
            if (target) setFocusRequest((current) => ({ id: target.id, seq: current.seq + 1 }));
          }}
        />
      )}

      {state.toast && (
        <Toast toastKey={state.toast.key} message={state.toast.message} onDismiss={dismissToast} />
      )}
    </main>
  );
}

export default App;
