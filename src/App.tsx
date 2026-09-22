import { useMemo } from "react";
import { Board } from "./components/Board";
import { useApplicants } from "./state/useApplicants";
import "./components/board.css";

function App() {
  const { state } = useApplicants();

  // order 와 byId 가 그대로면 같은 배열을 돌려줘 Board 의 그룹핑 메모가 유지된다.
  const applicants = useMemo(
    () => state.order.map((id) => state.byId[id]),
    [state.order, state.byId],
  );

  return (
    <main className="app">
      <h1 className="app__title">채용 파이프라인 보드</h1>
      <p className="app__summary">지원자 {applicants.length}명</p>

      {state.status === "ready" && <Board applicants={applicants} />}
    </main>
  );
}

export default App;
