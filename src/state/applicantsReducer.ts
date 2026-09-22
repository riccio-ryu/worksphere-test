import type { Applicant, Stage } from "../types";

export type Status = "loading" | "ready" | "error";

/** 낙관적으로 화면을 바꾸기 직전의 모습. 실패하면 이 값으로 되돌린다. */
export interface PendingMove {
  previousStage: Stage;
  previousIndex: number;
}

export interface Toast {
  /** 같은 메시지가 연달아 떠도 새 알림으로 인식되도록 매번 증가시킨다. */
  key: number;
  message: string;
}

export interface State {
  status: Status;
  error: string | null;
  /** 카드 한 장을 O(1)로 찾고 갱신하기 위해 id 맵으로 보관한다. */
  byId: Record<string, Applicant>;
  /** 표시 순서. 검색·필터는 이 배열만 줄이면 된다. */
  order: string[];
  /** 서버 응답을 기다리는 이동. 값이 롤백용 스냅샷이다. */
  pending: Record<string, PendingMove>;
  toast: Toast | null;
}

export type Action =
  | { type: "fetch/start" }
  | { type: "fetch/success"; applicants: Applicant[] }
  | { type: "fetch/error"; message: string }
  | { type: "move/start"; id: string; stage: Stage }
  | { type: "move/success"; applicant: Applicant }
  | { type: "move/failure"; id: string; message: string }
  | { type: "toast/dismiss" };

export const initialState: State = {
  status: "loading",
  error: null,
  byId: {},
  order: [],
  pending: {},
  toast: null,
};

/** 옮긴 카드를 맨 앞으로 보낸다. 대상 컬럼 최상단에 나타나야 결과가 눈에 띈다. */
function moveToFront(order: string[], id: string): string[] {
  return [id, ...order.filter((other) => other !== id)];
}

/** 맨 앞으로 보냈던 카드를 원래 자리로 돌려놓는다. */
function restorePosition(order: string[], id: string, index: number): string[] {
  const rest = order.filter((other) => other !== id);
  rest.splice(index, 0, id);
  return rest;
}

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

      return { ...state, status: "ready", error: null, byId, order, pending: {} };
    }

    case "fetch/error":
      return { ...state, status: "error", error: action.message };

    // 서버에 보내기 전에 화면부터 바꾼다. 되돌릴 값은 pending 에 남긴다.
    case "move/start": {
      const current = state.byId[action.id];
      if (!current) return state;

      return {
        ...state,
        byId: { ...state.byId, [action.id]: { ...current, stage: action.stage } },
        order: moveToFront(state.order, action.id),
        pending: {
          ...state.pending,
          [action.id]: {
            previousStage: current.stage,
            previousIndex: state.order.indexOf(action.id),
          },
        },
      };
    }

    // 화면은 이미 바뀌어 있다. 서버가 준 값으로 맞추고 스냅샷만 버린다.
    case "move/success": {
      const { id } = action.applicant;
      const { [id]: _done, ...pending } = state.pending;

      return {
        ...state,
        byId: { ...state.byId, [id]: action.applicant },
        pending,
      };
    }

    // 스냅샷으로 단계와 위치를 함께 되돌린다. 둘 중 하나만 되돌리면 카드가 엉뚱한 자리에 남는다.
    case "move/failure": {
      const { [action.id]: snapshot, ...pending } = state.pending;
      const current = state.byId[action.id];
      if (!snapshot || !current) return state;

      return {
        ...state,
        byId: { ...state.byId, [action.id]: { ...current, stage: snapshot.previousStage } },
        order: restorePosition(state.order, action.id, snapshot.previousIndex),
        pending,
        toast: { key: (state.toast?.key ?? 0) + 1, message: action.message },
      };
    }

    case "toast/dismiss":
      return { ...state, toast: null };

    default:
      return state;
  }
}
