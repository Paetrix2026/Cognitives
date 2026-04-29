export function registerSocketHandlers() {
  return {
    path: "/ws",
    projectRoomPrefix: "project:",
    auditorRoom: "auditor",
  };
}
