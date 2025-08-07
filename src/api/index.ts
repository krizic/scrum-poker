import PouchDB from "pouchdb";
import { v4 as uuid } from "uuid";

import { ISessionDb, IEstimation } from "./interfaces";
import { IUserInfo } from "../services";

export class ApiService {
  readonly db_name = "sessions";
  private db: PouchDB.Database<ISessionDb>;

  private constructor() {
    this.db = new PouchDB(`${process.env.REACT_APP_API}${this.db_name}`, {
      fetch: function (url, opts) {
        opts.headers = Object.assign(opts.headers || {}, {
          "Access-Control-Allow-Origin": "*",
        });
        console.log("FETCH heade", opts.headers);
        return PouchDB.fetch(url, opts);
      },
    });
    console.log("API SERVICE", process.env.REACT_APP_API);
  }

  info() {
    return this.db.info();
  }

  post(data: Partial<ISessionDb>) {
    return this.db.post(data);
  }

  getSession(sessionId: string) {
    return this.db.get(sessionId);
  }

  update(document: PouchDB.Core.PutDocument<ISessionDb>) {
    document.last_updated = new Date().getTime();
    return this.db.put(document);
  }

  delete(sessionId: string) {
    return this.getSession(sessionId).then((session) => {
      return this.db.remove({ _id: sessionId, _rev: session._rev });
    });
  }

  getEstimation(sessionId: string, estimationId: string) {
    return this.db.get(sessionId).then((session) => {
      return [session.estimations?.[estimationId], session];
    });
  }

  vote(
    sessionId: string,
    estimationId: string,
    userInfo: IUserInfo,
    vote?: string
  ) {
    return this.getEstimation(sessionId, estimationId).then(
      ([estimation, session]: [
        IEstimation,
        ISessionDb & PouchDB.Core.IdMeta & PouchDB.Core.GetMeta
      ]) => {
        if ((!vote && !estimation.votes[userInfo.id]) || vote) {
          estimation.votes[userInfo.id] = {
            id: userInfo.id,
            timestamp: new Date().getTime(),
            value: vote,
            pattern: userInfo.pattern,
            voter_username: userInfo.username,
            voter_email: userInfo.email,
          };
          return this.updateEstimation(
            { _id: session._id, _rev: session._rev },
            estimation
          );
        }
      }
    );
  }

  importEstimations(
    sessionId: string,
    estimations: { [key: string]: IEstimation }
  ) {
    return this.getSession(sessionId).then((session) => {
      session.estimations = Object.assign({}, session.estimations, estimations);
      return this.update(session);
    });
  }

  createNewEstimation(
    document: PouchDB.Core.PutDocument<ISessionDb>,
    newEstimation: Partial<IEstimation>
  ) {
    const id = uuid();
    const estimations = document.estimations ?? {};
    estimations[id] = { ...newEstimation, id } as any;
    document.estimations = estimations;

    return this.db.put(document);
  }

  updateEstimation(
    refDocument: PouchDB.Core.PutDocument<ISessionDb>,
    estimation: IEstimation
  ) {
    if (refDocument._id && refDocument._rev) {
      return this.db.get(refDocument._id).then((document) => {
        if (document.estimations) {
          //set all other to inactive
          document.estimations = Object.keys(document.estimations).reduce(
            (next, currentEstKey) => {
              if (next[currentEstKey].id === estimation.id) {
                next[currentEstKey] = estimation;
              } else {
                if (estimation.isActive) {
                  next[currentEstKey].isActive = false;
                }
              }
              return next;
            },
            document.estimations
          );
        } else {
          document.estimations = { [estimation.id!]: estimation };
        }
        return this.db
          .put(document)
          .then(() => {
            return document;
          })
          .catch((err) => {
            console.error("updateEstimation:put", err);
            return document;
          });
      });
    }
  }

  deleteEstimation(
    refDocument: PouchDB.Core.PutDocument<ISessionDb>,
    estimationId: string
  ) {
    this.db.get(refDocument._id!).then((document) => {
      if (document.estimations) {
        delete document.estimations[estimationId];
        this.db.put(document);
      }
    });
  }

  onChange(
    callback: (change?: PouchDB.Core.ChangesResponseChange<ISessionDb>) => any
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
  private static _instance: ApiService;
  public static get Instance() {
    return this._instance || (this._instance = new this());
  }
}
