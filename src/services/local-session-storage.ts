export interface ISessionAccess {
  _id: string;
  session_name: string;
  session_pin: string;
  created_at: number;
}

const sessionKey = "sp_sessions";

export class UserSessionApi {

}


export class LocalSessionApi {
  static saveSession(session: ISessionAccess) {
    let currentSessions = this.getSessions();
    localStorage.setItem(
      sessionKey,
      JSON.stringify(
        currentSessions?.length ? [...currentSessions, session] : [session]
      )
    );
  }

  static getSessions(): ISessionAccess[] | null {
    const sessionsString = localStorage.getItem(sessionKey);
    return sessionsString ? JSON.parse(sessionsString) : null;
  }

  static deleteSession(sessionId: string) {
    let sessions = this.getSessions();
    if (sessions && sessions.length) {
      sessions = sessions.filter((session) => {
        return session._id !== sessionId;
      });
      localStorage.setItem(sessionKey, JSON.stringify(sessions));
    }
  }

  static getSession(sessionId: string): ISessionAccess | null {
    const sessions = this.getSessions();
    let result: ISessionAccess | null = null;
    if (sessions && sessions.length) {
      result =
        sessions.filter((session) => {
          return session._id === sessionId;
        })[0] || null;
    }
    return result;
  }
}
