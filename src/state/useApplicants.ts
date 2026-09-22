import { useCallback, useEffect, useReducer } from "react";
import { fetchApplicants, updateStage } from "../mock/api";
import { applicantsReducer, initialState } from "./applicantsReducer";
import type { Stage } from "../types";

export function useApplicants() {
  const [state, dispatch] = useReducer(applicantsReducer, initialState);

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

  const move = useCallback(async (id: string, stage: Stage) => {
    // 화면을 먼저 바꾸고 요청을 보낸다.
    dispatch({ type: "move/start", id, stage });

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
  }, []);

  const dismissToast = useCallback(() => {
    dispatch({ type: "toast/dismiss" });
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { state, move, reload, dismissToast };
}
