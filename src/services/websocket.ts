export function createDriverWebSocket(WS_URL: string) {
  let ws: WebSocket | null = null;

  function connect(
    onOpen: () => void,
    onMessage: (event: MessageEvent) => void,
    onClose: () => void,
    onError: () => void
  ) {
    ws = new WebSocket(WS_URL);

    ws.onopen = onOpen;
    ws.onmessage = onMessage;
    ws.onclose = onClose;
    ws.onerror = onError;

    return ws;
  }

  function send(data: object) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  function close() {
    if (ws) ws.close();
  }

  return { connect, send, close };
}
