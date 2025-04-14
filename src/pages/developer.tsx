import React, { useEffect, useState, useMemo } from "react";
import "./developer.scss";
import { LocalUser, LocalUserInfoApi } from "../services";
import DevSignIn from "../components/dev-sign-in/dev-sign-in";
import DevEstimation from "../components/dev-estimation/dev-estimation";
import { Segment, Loader } from "semantic-ui-react";
import { WithRoutes, withRouter } from "../utils";
import { PlayerService, SessionService } from "../api";
import { Player, Session } from "../api/model";

export interface IDeveloperPageProps extends WithRoutes {}

const DeveloperPage: React.FC<IDeveloperPageProps> = ({ router }) => {
  const sessionService = useMemo(() => new SessionService(), []);
  const playerService = useMemo(() => new PlayerService(), []);

  const params = new URLSearchParams(router.location.search);
  const sessionId = params.get("id");

  const [localUser, setLocalUser] = useState<LocalUser | undefined>(
    LocalUserInfoApi.getUserInfo() || undefined
  );
  const [user, setUser] = useState<Player | undefined>(undefined);
  const [sessionValid, setSessionValid] = useState<boolean | undefined>(
    undefined
  );
  const [session, setSession] = useState<Session | undefined>(undefined);
  const [initialLoad, setInitialLoad] = useState<boolean>(false);

  useEffect(() => {
    if (sessionId) {
      sessionService
        .get(sessionId)
        .then((sessionResponse) => {
          setSessionValid(sessionResponse?.id === sessionId);
          setSession(sessionResponse);
        })
        .catch(() => {
          setSessionValid(false);
        })
        .finally(() => {
          setInitialLoad(true);
        });
    }

    if (localUser) {
      playerService.get(localUser.id).then((player) => {
        setUser(player);
      });
    }
  }, []);

  const onUserSignIn = (userInfo: Player) => {
    playerService.create(userInfo).then((player) => {
      LocalUserInfoApi.saveUserInfo({ id: player.id });
      setUser(player);
    });
  };

  const main = useMemo(() => {
    if (!sessionId || !sessionValid) {
      return <Segment>No session Id</Segment>;
    }

    return user ? (
      <DevEstimation user={user} session={session!}></DevEstimation>
    ) : (
      <DevSignIn onUserSign={onUserSignIn}></DevSignIn>
    );
  }, [sessionId, sessionValid, user, session]);

  return (
    <div className="developer-page">
      {initialLoad && main}
      {!initialLoad && (
        <Loader inverted active size="huge" content="Loading" />
      )}
    </div>
  );
};

export default withRouter(DeveloperPage);