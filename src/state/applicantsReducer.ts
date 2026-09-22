import type { Applicant } from "../types";

export type Status = "loading" | "ready" | "error";

export interface State {
  status: Status;
  error: string | null;
  /** 카드 한 장을 O(1)로 찾고 갱신하기 위해 id 맵으로 보관한다. */
  byId: Record<string, Applicant>;
  /** 표시 순서. 검색·필터는 이 배열만 줄이면 된다. */
  order: string[];
  /** 이동 요청이 진행 중인 카드. 같은 카드를 다시 누르지 못하게 막는다. */
  moving: Record<string, true>;
}

export type Action =
  | { type: "fetch/start" }
  | { type: "fetch/success"; applicants: Applicant[] }
  | { type: "fetch/error"; message: string }
  | { type: "move/start"; id: string }
  | { type: "move/success"; applicant: Applicant }
  | { type: "move/failure"; id: string };

export const initialState: State = {
  status: "loading",
  error: null,
  byId: {},
  order: [],
  moving: {},
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

      return { status: "ready", error: null, byId, order, moving: {} };
    }

    case "fetch/error":
      return { ...state, status: "error", error: action.message };

    case "move/start":
      return { ...state, moving: { ...state.moving, [action.id]: true } };

    // 서버가 확정한 뒤에 화면을 바꾼다. 낙관적 갱신은 다음 단계에서 붙인다.
    case "move/success": {
      const { id } = action.applicant;
      const { [id]: _done, ...moving } = state.moving;

      return {
        ...state,
        byId: { ...state.byId, [id]: action.applicant },
        // 옮긴 카드를 맨 앞으로 보내 대상 컬럼 최상단에 오게 한다.
        // 서버도 같은 규칙으로 저장하므로 새로고침해도 위치가 유지된다.
        order: [id, ...state.order.filter((other) => other !== id)],
        moving,
      };
    }

    case "move/failure": {
      const { [action.id]: _failed, ...moving } = state.moving;
      return { ...state, moving };
    }

    default:
      return state;
  }
}
