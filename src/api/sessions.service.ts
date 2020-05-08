import PouchDB from "pouchdb";

import {ISessionDto} from "./interfaces";

export class SessionService {
  readonly db_name = "sessions";
  private db: PouchDB.Database<ISessionDto>;

  private constructor() {
    this.db = new PouchDB(`${process.env.REACT_APP_API}${this.db_name}`, {});
    console.log("API SERVICE", process.env.REACT_APP_API);
  }

  info() {
    return this.db.info();
  }

  post(data: Partial<ISessionDto>) {
    return this.db.post(data);
  }

  getSession(sessionId: string) {
    return this.db.get(sessionId);
  }

  update(document: PouchDB.Core.PutDocument<ISessionDto>) {
    document.last_updated = new Date().getTime();
    return this.db.put(document);
  }

  delete(sessionId: string) {
    return this.getSession(sessionId).then((session) => {
      return this.db.remove({_id: sessionId, _rev: session._rev});
    });
  }

  onChange(
    callback: (change?: PouchDB.Core.ChangesResponseChange<ISessionDto>) => any
  ) {
    this.db
      .changes({
        since: "now",
        live: true,
      })
      .on("change", (change) => {
        callback(change);
      });
  }

  // Singleton set up
  private static _instance: SessionService;
  public static get Instance() {
    return this._instance || (this._instance = new this());
  }
}
