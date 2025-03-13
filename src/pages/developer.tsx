import * as React from "react";
import "./developer.scss";
import { LocalUser, LocalUserInfoApi } from "../services";
import DevSignIn from "../components/dev-sign-in/dev-sign-in";
import DevEstimation from "../components/dev-estimation/dev-estimation";
import { Segment, Loader } from "semantic-ui-react";
// import {ApiService} from "../api/indexold";
import { WithRoutes, withRouter } from "../utils";
import { PlayerService, SessionService } from "../api";
import { Player, Session } from "../api/model";

export interface IDeveloperPageProps extends WithRoutes {}

export interface IDeveloperPageState {
  localUser?: LocalUser;
  user?: Player;
  sessionValid?: boolean;
  session?: Session;
  initialLoad?: boolean;
}

class DeveloperPage extends React.Component<
  IDeveloperPageProps,
  IDeveloperPageState
> {
  sessionId: string;
  sessionService = new SessionService();
  playerService = new PlayerService();

  constructor(props: IDeveloperPageProps) {
    super(props);

    const params = new URLSearchParams(this.props.router.location.search);
    this.sessionId = params.get("id");
    this.state = { localUser: LocalUserInfoApi.getUserInfo() || undefined };
  }

  componentDidMount() {
    if (this.sessionId) {
      this.sessionService
        .get(this.sessionId)
        .then((sessionResponse) => {
          this.setState({
            sessionValid: sessionResponse?.id === this.sessionId,
            session: sessionResponse,
          });
        })
        .catch((error) => {
          this.setState({ sessionValid: false });
        })
        .finally(() => {
          this.setState({ initialLoad: true });
        });
    }

    // RehydratePlayerInfo
    if (this.state.localUser) {
      this.playerService.get(this.state.localUser?.id).then((player) => {
        this.setState({ user: player });
      });
    }
  }

  onUserSignIn = (userInfo: Player) => {
    this.playerService.create(userInfo).then((player) => {
      LocalUserInfoApi.saveUserInfo({ id: player.id });
      this.setState({ user: player });
    });
  };

  public render() {
    const main =
      this.sessionId && this.state.sessionValid ? (
        this.state.user ? (
          <DevEstimation
            user={this.state.user}
            session={this.state.session}
          ></DevEstimation>
        ) : (
          <DevSignIn onUserSign={this.onUserSignIn}></DevSignIn>
        )
      ) : (
        <Segment>No session Id</Segment>
      );

    return (
      <div className="developer-page">
        {this.state.initialLoad && main}
        {!this.state.initialLoad && (
          <Loader inverted active size="huge" content="Loading" />
        )}
      </div>
    );
  }
}

export default withRouter(DeveloperPage);
