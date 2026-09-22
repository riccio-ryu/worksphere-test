import type { Applicant } from "../types";

export type Status = "loading" | "ready" | "error";

export interface State {
  status: Status;
  error: string | null;
  /** 카드 한 장을 O(1)로 찾고 갱신하기 위해 id 맵으로 보관한다. */
  byId: Record<string, Applicant>;
  /** 표시 순서. 검색·필터는 이 배열만 줄이면 된다. */
  order: string[];
}

export type Action =
  | { type: "fetch/start" }
  | { type: "fetch/success"; applicants: Applicant[] }
  | { type: "fetch/error"; message: string };

export const initialState: State = {
  status: "loading",
  error: null,
  byId: {},
  order: [],
};

export function applicantsReducer(state: State, action: Action): State {
  switch (action.type) {
    case "fetch/start":
      return { ...state, status: "loading", error: null };

    case "fetch/success": {
      const byId: Record<string, Applicant> = {};
      const order: string[] = [];

      for (const applicant of action.applicants) {
        byId[applicant.id] = applicant;
        order.push(applicant.id);
      }

      return { status: "ready", error: null, byId, order };
    }

    case "fetch/error":
      return { ...state, status: "error", error: action.message };

    default:
      return state;
  }
}
