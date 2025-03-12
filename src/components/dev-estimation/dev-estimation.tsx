import * as React from "react";
// import { ApiService } from "../../api/indexold";
import { IEstimation } from "../../api/interfaces";
import { Segment, Divider } from "semantic-ui-react";
import { IUserInfo } from "../../services";
import PokerCard from "../poker-card/poker-card";
import "./dev-estimation.scss";
import ReactMarkdown from "react-markdown";

export interface IDevEstimationProps {
  sessionId: string;
  userInfo: IUserInfo;
}

export interface IDevEstimationState {
  activeEstimation?: IEstimation;
  sessionName?: string;
  currentSelectedVote?: string;
  oneLoading?: string;
}

export default class DevEstimation extends React.Component<
  IDevEstimationProps,
  IDevEstimationState
> {
  readonly api: any = {};
  readonly cardValues: string[] = [
    "0",
    "1",
    "2",
    "3",
    "5",
    "8",
    "13",
    "20",
    "40",
    "?",
  ];

  state: IDevEstimationState = {};

  componentDidMount() {
    this.setActiveEstimation();
    this.api.onChange(this.onActiveEstimationChange);
  }

  setActiveEstimation() {
    return this.api.getSession(this.props.sessionId).then((result) => {
      const activeEstimation: IEstimation | undefined = Object.keys(
        result.estimations!
      ).reduce((acc, current) => {
        const currentEstimation = result.estimations![current];
        acc = currentEstimation.isActive ? currentEstimation : acc;
        return acc;
      }, undefined as IEstimation | undefined);

      const currentSelectedVote =
        activeEstimation?.votes?.[this.props.userInfo.id]?.value;

      this.setState({
        activeEstimation,
        sessionName: result.session_name,
        currentSelectedVote,
      });
    });
  }

  onActiveEstimationChange = () => {
    this.setActiveEstimation().then(() => {
      if (this.state.activeEstimation) {
        this.api.vote(
          this.props.sessionId,
          this.state.activeEstimation.id,
          this.props.userInfo
        );
      }
    });
  };

  onCardSelected = async (value: string) => {
    this.setState({ oneLoading: value });
    await this.api.vote(
      this.props.sessionId,
      this.state.activeEstimation.id,
      this.props.userInfo,
      value
    );
    this.setState({ oneLoading: null });
  };

  public render() {
    return (
      <>
        <Segment.Group>
          <Segment secondary size="big">
            Session: {this.state.sessionName}
          </Segment>

          {!this.state.activeEstimation && (
            <Segment padded="very" textAlign="center">
              No Active Estimation.
            </Segment>
          )}
        </Segment.Group>
        {this.state.activeEstimation && (
          <Segment.Group>
            <Segment color="violet">
              Story Name: {this.state.activeEstimation.name}
            </Segment>
            {this.state.activeEstimation.description && (
              <Segment secondary>
                Story Description:
                <Divider />
                <ReactMarkdown
                  children={this.state.activeEstimation.description}
                />
              </Segment>
            )}
            <Segment>
              <div className="card-wrapper">
                {this.cardValues.map((value) => {
                  return (
                    <PokerCard
                      isLoading={this.state.oneLoading === value}
                      key={value}
                      onSelect={this.onCardSelected}
                      className={`dev-card ${
                        value === this.state.currentSelectedVote
                          ? "selected"
                          : ""
                      }`}
                      side="front"
                      voteValue={value}
                      voterUsername={this.props.userInfo.username}
                    ></PokerCard>
                  );
                })}
              </div>
            </Segment>
          </Segment.Group>
        )}
      </>
    );
  }
}
