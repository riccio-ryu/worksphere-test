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
    (id: string, stage: Stage) => {
      // 화면은 누르는 즉시 바꾸고, 서버 요청만 카드별로 줄을 세운다.
      dispatch({ type: "move/start", id, stage });

      return enqueue(id, async () => {
        try {
          const applicant = await updateStage(id, stage);
          dispatch({ type: "move/success", applicant });
        } catch (error) {
          dispatch({
            type: "move/failure",
            id,
            message: error instanceof Error ? error.message : "단계 이동에 실패했습니다.",
          });
        }
      });
    },
    [enqueue],
  );

  const dismissToast = useCallback(() => {
    dispatch({ type: "toast/dismiss" });
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { state, move, reload, dismissToast };
}
