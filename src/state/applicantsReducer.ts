import type { Applicant, Stage } from "../types";

type Status = "loading" | "ready" | "error";

/**
 * 낙관적으로 화면을 바꾸기 직전의 모습. 실패하면 이 값으로 되돌린다.
 * 같은 카드를 연속으로 누르면 요청이 겹치므로, 스냅샷은 첫 요청 때 한 번만 남기고
 * 진행 중인 요청 수를 센다. 마지막 응답이 도착했을 때만 확정하거나 되돌린다.
 */
interface PendingMove {
  previousStage: Stage;
  /** 원래 바로 앞에 있던 카드. 위치를 인덱스로 기억하면 다른 카드가 움직일 때 어긋난다. */
  previousAnchorId: string | null;
  /** 아직 응답을 기다리는 요청 수 */
  inFlight: number;
}

/** 되돌리기 대상. 성공한 이동 하나를 기억한다. */
export interface LastMove {
  id: string;
  name: string;
  from: Stage;
  to: Stage;
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
  /** 마지막으로 서버까지 반영된 이동. 없으면 되돌릴 것이 없다. */
  lastMove: LastMove | null;
}

type Action =
  | { type: "fetch/start" }
  | { type: "fetch/success"; applicants: Applicant[] }
  | { type: "fetch/error"; message: string }
  | { type: "move/start"; id: string; stage: Stage }
  | { type: "move/success"; applicant: Applicant }
  | { type: "move/failure"; id: string; message: string }
  | { type: "toast/dismiss" }
  | { type: "undo/clear" };

export const initialState: State = {
  status: "loading",
  error: null,
  byId: {},
  order: [],
  pending: {},
  toast: null,
  lastMove: null,
};

/** 바로 앞에 있던 카드의 id. 맨 앞이면 null. */
function anchorOf(order: string[], id: string): string | null {
  const at = order.indexOf(id);
  return at > 0 ? order[at - 1] : null;
}

/** 옮긴 카드를 맨 앞으로 보낸다. 대상 컬럼 최상단에 나타나야 결과가 눈에 띈다. */
function moveToFront(order: string[], id: string): string[] {
  return [id, ...order.filter((other) => other !== id)];
}

/**
 * 맨 앞으로 보냈던 카드를 원래 자리로 돌려놓는다.
 * 기준점은 원래 바로 앞에 있던 카드다. 인덱스로 되돌리면 그 사이에 다른 카드가
 * 앞으로 이동했을 때 한 칸씩 밀린 자리에 들어간다.
 */
function restorePosition(order: string[], id: string, anchorId: string | null): string[] {
  const rest = order.filter((other) => other !== id);
  if (anchorId === null) return [id, ...rest];

  const at = rest.indexOf(anchorId);
  if (at === -1) return [...rest, id];

  rest.splice(at + 1, 0, id);
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

      return { ...state, status: "ready", error: null, byId, order, pending: {}, lastMove: null };
    }

    case "fetch/error":
      return { ...state, status: "error", error: action.message };

    // 서버에 보내기 전에 화면부터 바꾼다. 되돌릴 값은 pending 에 남긴다.
    case "move/start": {
      const current = state.byId[action.id];
      if (!current) return state;

      const ongoing = state.pending[action.id];
      // 이미 요청이 떠 있으면 스냅샷을 덮지 않는다.
      // 덮으면 아직 확정되지 않은 값으로 되돌리게 된다.
      const snapshot: PendingMove = ongoing
        ? { ...ongoing, inFlight: ongoing.inFlight + 1 }
        : {
            previousStage: current.stage,
            previousAnchorId: anchorOf(state.order, action.id),
            inFlight: 1,
          };

      return {
        ...state,
        byId: { ...state.byId, [action.id]: { ...current, stage: action.stage } },
        order: moveToFront(state.order, action.id),
        pending: { ...state.pending, [action.id]: snapshot },
      };
    }

    // 화면은 이미 바뀌어 있다. 마지막 응답일 때만 서버 값으로 맞추고 스냅샷을 버린다.
    case "move/success": {
      const { id } = action.applicant;
      const ongoing = state.pending[id];
      if (!ongoing) return state;

      if (ongoing.inFlight > 1) {
        return {
          ...state,
          pending: { ...state.pending, [id]: { ...ongoing, inFlight: ongoing.inFlight - 1 } },
        };
      }

      const { [id]: _done, ...pending } = state.pending;
      return {
        ...state,
        byId: { ...state.byId, [id]: action.applicant },
        pending,
        // 서버까지 반영된 이동만 되돌릴 수 있다. 화면만 바뀐 상태를 기억하면
        // 되돌리기가 서버에 없는 변경을 취소하려 든다.
        lastMove: {
          id,
          name: action.applicant.name,
          from: ongoing.previousStage,
          to: action.applicant.stage,
        },
      };
    }

    // 스냅샷으로 단계와 위치를 함께 되돌린다. 둘 중 하나만 되돌리면 카드가 엉뚱한 자리에 남는다.
    // 뒤따르는 요청이 남아 있으면 되돌리지 않는다. 마지막 응답이 최종 상태를 정한다.
    case "move/failure": {
      const snapshot = state.pending[action.id];
      const current = state.byId[action.id];
      if (!snapshot || !current) return state;

      if (snapshot.inFlight > 1) {
        return {
          ...state,
          pending: {
            ...state.pending,
            [action.id]: { ...snapshot, inFlight: snapshot.inFlight - 1 },
          },
        };
      }

      const { [action.id]: _failed, ...pending } = state.pending;
      return {
        ...state,
        byId: { ...state.byId, [action.id]: { ...current, stage: snapshot.previousStage } },
        order: restorePosition(state.order, action.id, snapshot.previousAnchorId),
        pending,
        toast: { key: (state.toast?.key ?? 0) + 1, message: action.message },
      };
    }

    case "toast/dismiss":
      return { ...state, toast: null };

    // 되돌리기는 한 번만 제공한다. 되돌린 뒤 또 되돌리면 같은 자리를 왕복하게 된다.
    case "undo/clear":
      return state.lastMove === null ? state : { ...state, lastMove: null };

    default:
      return state;
  }
}
