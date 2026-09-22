import { useMemo } from "react";
import { Board } from "./components/Board";
import { BoardEmpty, BoardError, BoardSkeleton } from "./components/BoardStates";
import { DemoControls } from "./components/DemoControls";
import { useApplicants } from "./state/useApplicants";
import "./components/board.css";

function App() {
  const { state, move, reload } = useApplicants();

  // order 와 byId 가 그대로면 같은 배열을 돌려줘 Board 의 그룹핑 메모가 유지된다.
  const applicants = useMemo(
    () => state.order.map((id) => state.byId[id]),
    [state.order, state.byId],
  );

  const summary =
    state.status === "loading"
      ? "불러오는 중"
      : state.status === "error"
        ? "불러오지 못했습니다"
        : `지원자 ${applicants.length}명`;

  return (
    <main className="app">
      <h1 className="app__title">채용 파이프라인 보드</h1>
      <p className="app__summary" aria-live="polite">
        {summary}
      </p>

      <DemoControls onReload={reload} />

      {state.status === "loading" && <BoardSkeleton />}
      {state.status === "error" && (
        <BoardError message={state.error ?? "알 수 없는 오류가 발생했습니다."} onRetry={reload} />
      )}
      {state.status === "ready" &&
        (applicants.length === 0 ? (
          <BoardEmpty />
        ) : (
          <Board applicants={applicants} moving={state.moving} onMove={move} />
        ))}
    </main>
  );
}

export default App;
