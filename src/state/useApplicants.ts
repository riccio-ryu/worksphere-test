import { useCallback, useEffect, useReducer, useRef } from "react";
import { fetchApplicants, updateStage } from "../mock/api";
import { applicantsReducer, initialState } from "./applicantsReducer";
import { createRequestQueue } from "./requestQueue";
import type { Stage } from "../types";

export function useApplicants() {
  const [state, dispatch] = useReducer(applicantsReducer, initialState);
  // 카드별로 요청을 한 줄로 세운다. 렌더마다 새로 만들면 줄이 끊긴다.
  const enqueue = useRef(createRequestQueue()).current;

  const reload = useCallback(async () => {
    dispatch({ type: "fetch/start" });

    try {
      const applicants = await fetchApplicants();
      dispatch({ type: "fetch/success", applicants });
    } catch (error) {
      dispatch({
        type: "fetch/error",
        message: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
      });
    }
  }, []);

  const move = useCallback(
    (id: string, stage: Stage, failureMessage?: string) => {
      // 화면은 누르는 즉시 바꾸고, 서버 요청만 카드별로 줄을 세운다.
      dispatch({ type: "move/start", id, stage });

      return enqueue(id, async () => {
        try {
          const applicant = await updateStage(id, stage);
          dispatch({ type: "move/success", applicant });
        } catch (error) {
          const fallback = error instanceof Error ? error.message : "단계 이동에 실패했습니다.";
          dispatch({ type: "move/failure", id, message: failureMessage ?? fallback });
        }
      });
    },
    [enqueue],
  );

  // undo 가 최신 상태와 move 를 보게 하되 참조는 고정한다.
  // 렌더 중에 ref 를 건드리면 값이 어긋날 수 있어 렌더가 끝난 뒤에 맞춘다.
  const latest = useRef({ lastMove: state.lastMove, move });
  useEffect(() => {
    latest.current = { lastMove: state.lastMove, move };
  });

  /**
   * 되돌리기는 롤백과 다르다.
   * 롤백은 실패한 요청을 화면에서 무르는 것이고, 되돌리기는 이미 서버까지 반영된 이동을
   * 반대 방향의 새 요청으로 뒤집는 것이다. 그래서 이 요청 자체도 실패할 수 있다.
   */
  const undo = useCallback(() => {
    const { lastMove: last, move: latestMove } = latest.current;
    if (!last) return;

    // 여기서 lastMove 를 지우지 않는다. 되돌리기도 실패할 수 있는데
    // 미리 지우면 실패했을 때 다시 시도할 방법이 사라진다.
    // 성공하면 move/success 가 새 대상으로 덮어쓴다.
    return latestMove(last.id, last.from, "되돌리기를 저장하지 못했습니다.");
  }, []);

  const dismissUndo = useCallback(() => {
    dispatch({ type: "undo/clear" });
  }, []);

  const dismissToast = useCallback(() => {
    dispatch({ type: "toast/dismiss" });
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { state, move, undo, dismissUndo, reload, dismissToast };
}
