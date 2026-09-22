/**
 * 같은 키의 작업이 겹치지 않게 차례로 실행한다.
 *
 * 같은 카드를 빠르게 연속으로 옮기면 요청이 동시에 떠서 서버 도착 순서가 클릭 순서와 달라질 수 있다.
 * 그러면 마지막으로 누른 단계가 아닌 값이 저장된다.
 * 카드마다 줄을 세워 두면 서버 반영 순서가 조작 순서와 같아진다.
 */
export function createRequestQueue() {
  const queues = new Map<string, Promise<unknown>>();

  return function enqueue(key: string, task: () => Promise<void>): Promise<void> {
    const previous = queues.get(key) ?? Promise.resolve();
    // 앞선 요청이 실패해도 뒤 요청은 이어서 보낸다.
    const next = previous.then(task, task);

    queues.set(key, next);
    void next.finally(() => {
      if (queues.get(key) === next) queues.delete(key);
    });

    return next;
  };
}
