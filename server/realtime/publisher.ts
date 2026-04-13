type RealtimePublisher = (battleCode: string, payload: unknown) => void;

let publisher: RealtimePublisher = () => {
  // no-op until a transport (WebSocket/Redis/etc.) is registered
};

export function setRealtimePublisher(nextPublisher: RealtimePublisher) {
  publisher = nextPublisher;
}

export function publishBattleVoteUpdate(battleCode: string, payload: unknown) {
  publisher(battleCode, payload);
}
