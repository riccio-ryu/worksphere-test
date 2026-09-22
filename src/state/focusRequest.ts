/**
 * "이 카드로 초점을 옮겨라"는 요청.
 *
 * id 만 두면 검색어를 치는 등 상관없는 렌더에서도 초점을 빼앗는다.
 * seq 를 같이 올려서 "새 요청일 때만" 초점을 옮기도록 구분한다.
 */
export interface FocusRequest {
  id: string | null;
  seq: number;
}

export const NO_FOCUS_REQUEST: FocusRequest = { id: null, seq: 0 };
