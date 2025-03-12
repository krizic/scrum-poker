import * as React from "react";
import {
  Button,
  Segment,
  SegmentGroup,
  Message,
  Icon,
} from "semantic-ui-react";
import ReactMarkdown from "react-markdown";

import "./votes-table.scss";
import CardReveal from "../card-reveal/card-reveal";
import EstimationChart from "../estimation-chart/estimation-chart";
import EstimationStatistics from "../est-statistics/est-statistics";
import { EstimationService, EstimationWithVotes, VoteService } from "../../api";

export interface IVotesTableProps {
  estimationWithVotes: EstimationWithVotes;
}

export default class VotesTable extends React.Component<IVotesTableProps> {
  voteService = new VoteService();
  estimationService = new EstimationService();

  constructor(props: IVotesTableProps) {
    super(props);
    this.state = {};
  }

  onToggleVoteClick = (event: React.MouseEvent, active: boolean) => {
    const { estimationWithVotes } = this.props;
    this.estimationService.changeEstimationStatus(
      estimationWithVotes.session_id,
      estimationWithVotes.id!,
      active
    );
  };

  onDeleteClick = (e: React.MouseEvent) => {
    this.estimationService.delete(this.props.estimationWithVotes.id!);
  };

  public render() {
    const { estimationWithVotes } = this.props;
    return estimationWithVotes ? (
      <div className="votes-table">
        <SegmentGroup>
          <Segment secondary textAlign="center">
            <Button.Group>
              <Button
                circular
                icon="play"
                color={!estimationWithVotes.isActive ? "blue" : undefined}
                disabled={estimationWithVotes.isActive}
                content="Start"
                onClick={(e) => {
                  this.onToggleVoteClick(e, true);
                }}
              />
              <Button
                icon="stop"
                disabled={!estimationWithVotes.isActive}
                negative={estimationWithVotes.isActive}
                content="Stop"
                onClick={(e) => {
                  this.onToggleVoteClick(e, false);
                }}
              />
              <Button
                disabled={estimationWithVotes.isActive}
                icon="trash alternate"
                content="Delete"
                onClick={this.onDeleteClick}
              />
            </Button.Group>
          </Segment>
          {estimationWithVotes.description && (
            <Segment secondary textAlign="left">
              <ReactMarkdown children={estimationWithVotes.description} />
            </Segment>
          )}
          {!estimationWithVotes.isActive &&
            !!estimationWithVotes.Vote.length && (
              <Segment.Group horizontal>
                <Segment>
                  <EstimationStatistics
                    estimation={estimationWithVotes}
                  ></EstimationStatistics>
                </Segment>
                <EstimationChart
                  estimation={estimationWithVotes}
                ></EstimationChart>
              </Segment.Group>
            )}
          {!estimationWithVotes.Vote?.length && (
            <Message warning attached="bottom">
              <Icon name="warning" />
              There are no votes for this story.
            </Message>
          )}
          {estimationWithVotes.Vote?.length && (
            <Segment>
              <div className="votes-table__cards">
                {estimationWithVotes.Vote.map((vote) => {
                  return (
                    <CardReveal
                      key={vote.id}
                      vote={vote}
                      shouldHide={estimationWithVotes.isActive}
                    ></CardReveal>
                  );
                })}
              </div>
            </Segment>
          )}
        </SegmentGroup>
      </div>
    ) : null;
  }
}
