import * as React from "react";
// import { ApiService } from "../../api/indexold";
import { IEstimation } from "../../api/interfaces";
import { Segment, Divider } from "semantic-ui-react";
import { IUserInfo } from "../../services";
import PokerCard from "../poker-card/poker-card";
import "./dev-estimation.scss";
import ReactMarkdown from "react-markdown";
import { EstimationService, EstimationWithVotes } from "../../api";
import { on } from "events";
import { EstimationWithPlayerVote } from "../../api/services";
import { Session } from "../../api/model";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface IDevEstimationProps {
  session: Session;
  userInfo: IUserInfo;
}

export interface IDevEstimationState {
  activeEstimation?: EstimationWithPlayerVote;
  currentSelectedVote?: string;
  onLoading?: string;
}

export default class DevEstimation extends React.Component<
  IDevEstimationProps,
  IDevEstimationState
> {
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
  estimationService = new EstimationService();
  subscriptions: RealtimeChannel[] = [];

  componentDidMount() {
    this.setActiveEstimation();
    this.subscriptions.push(
      this.estimationService
        .changes(
          "session_id",
          this.props.session.id,
          this.onActiveEstimationChange
        )
        .subscribe()
    );
  }

  componentWillUnmount(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }

  setActiveEstimation() {
    return this.estimationService
      .getActiveEstimationWithPlayerVote(
        this.props.session.id,
        this.props.userInfo.id
      )
      .then((activeEstimation) => {
        if (!activeEstimation) {
          this.setState({ activeEstimation: undefined });
        } else {
          const currentSelectedVote = activeEstimation.Vote.find(
            (vote) => vote.player_id === this.props.userInfo.id
          )?.value;

          this.setState({
            activeEstimation,
            currentSelectedVote,
          });
        }
      });
  }

  onActiveEstimationChange = () => {
    this.setActiveEstimation().then(() => {
      if (this.state.activeEstimation) {
        // this.api.vote(
        //   this.props.sessionId,
        //   this.state.activeEstimation.id,
        //   this.props.userInfo
        // );
      }
    });
  };

  onCardSelected = async (value: string) => {
    // this.setState({ onLoading: value });
    // await this.api.vote(
    //   this.props.sessionId,
    //   this.state.activeEstimation.id,
    //   this.props.userInfo,
    //   value
    // );
    // this.setState({ oneLoading: null });
  };

  public render() {
    return (
      <>
        <Segment.Group>
          <Segment secondary size="big">
            Session: {this.props.session.name}
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
                      isLoading={this.state.onLoading === value}
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
