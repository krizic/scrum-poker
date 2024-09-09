export interface ISessionAccess {
  _id: string;
  session_name: string;
  session_pin: string;
  created_at: number;
}

const sessionKey = "sp_sessions";

export class UserSessionApi {

}


export function saveSession(session: ISessionAccess) {
  const currentSessions = getSessions();
  localStorage.setItem(
    sessionKey,
    JSON.stringify(
      currentSessions?.length ? [...currentSessions, session] : [session]
    )
  );
}

export function getSessions(): ISessionAccess[] | null {
  const sessionsString = localStorage.getItem(sessionKey);
  return sessionsString ? JSON.parse(sessionsString) : null;
}

export function deleteSession(sessionId: string) {
  let sessions = getSessions();
  if (sessions?.length) {
    sessions = sessions.filter((session) => {
      return session._id !== sessionId;
    });
    localStorage.setItem(sessionKey, JSON.stringify(sessions));
  }
}

export function getSession(sessionId: string): ISessionAccess | null {
  const sessions = getSessions();
  let result: ISessionAccess | null = null;
  if (sessions?.length) {
    result =
      sessions.filter((session) => {
        return session._id === sessionId;
      })[0] || null;
  }
  return result;
}
