import { useCallback, useEffect, useReducer } from "react";
import { fetchApplicants } from "../mock/api";
import { applicantsReducer, initialState } from "./applicantsReducer";

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

  useEffect(() => {
    void reload();
  }, [reload]);

  return { state, dispatch, reload };
}
