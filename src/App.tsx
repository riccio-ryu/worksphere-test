import { useDeferredValue, useMemo, useState } from "react";
import { Board } from "./components/Board";
import { ALL_ROLES, BoardFilters } from "./components/BoardFilters";
import { BoardEmpty, BoardError, BoardSkeleton } from "./components/BoardStates";
import { DemoControls } from "./components/DemoControls";
import { Toast } from "./components/Toast";
import { useApplicants } from "./state/useApplicants";
import "./components/board.css";

function App() {
  const { state, move, reload, dismissToast } = useApplicants();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<string>(ALL_ROLES);

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
          <Board applicants={visible} pendingIds={state.pending} onMove={move} />
        ))}

      {state.toast && (
        <Toast toastKey={state.toast.key} message={state.toast.message} onDismiss={dismissToast} />
      )}
    </main>
  );
}

export default App;
