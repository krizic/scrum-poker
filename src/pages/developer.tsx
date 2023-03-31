import * as React from "react";
import "./developer.scss";
import {IUserInfo, LocalUserInfoApi} from "../services";
import DevSignIn from "../components/dev-sign-in/dev-sign-in";
import DevEstimation from "../components/dev-estimation/dev-estimation";
import {Segment, Loader} from "semantic-ui-react";
import {ApiService} from "../api";
import { WithRoutes, withRouter } from "../utils";

export interface IDeveloperPageProps extends WithRoutes {}

export interface IDeveloperPageState {
  userInfo?: IUserInfo;
  sessionValid?: boolean;
  initialLoad?: boolean;
}

class DeveloperPage extends React.Component<
  IDeveloperPageProps,
  IDeveloperPageState
> {
  sessionId: string;

  readonly api: ApiService = ApiService.Instance;

  constructor(props: IDeveloperPageProps) {
    super(props);

    const params = new URLSearchParams(this.props.router.location.search);
    this.sessionId = params.get("id");
    this.state = {userInfo: LocalUserInfoApi.getUserInfo() || undefined};
  }

  componentDidMount() {
    if (this.sessionId) {
      this.api
        .getSession(this.sessionId)
        .then((response) => {
          this.setState({sessionValid: true});
        })
        .catch((error) => {
          this.setState({sessionValid: false});
        })
        .finally(() => {
          this.setState({initialLoad: true});
        });
    }
  }

  onUserSignIn = (userInfo: IUserInfo) => {
    this.setState({userInfo});
  };

  public render() {
    const main =
      this.sessionId && this.state.sessionValid ? (
        this.state.userInfo ? (
          <DevEstimation userInfo={this.state.userInfo} sessionId={this.sessionId}></DevEstimation>
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
