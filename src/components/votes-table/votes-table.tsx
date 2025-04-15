import React, { useEffect, useState, useCallback } from "react";
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
import { RealtimeChannel } from "@supabase/supabase-js";
import { selectEstimationChangeStream, useAppSelector } from "../../store";

export interface IVotesTableProps {
  estimationId: string;
}

const VotesTable: React.FC<IVotesTableProps> = ({ estimationId }) => {
  const voteService = new VoteService();
  const estimationService = new EstimationService();
  const [subscriptions, setSubscriptions] = useState<RealtimeChannel[]>([]);
  const [estimationWithVotes, setEstimationWithVotes] = useState<
    EstimationWithVotes | undefined
  >(undefined);

  const estimationStream = useAppSelector(selectEstimationChangeStream)

  const getEstimation = useCallback(() => {
    estimationService
      .getOneWithVotes(estimationId)
      .then((estimation) => setEstimationWithVotes(estimation));
  }, [estimationId, estimationService]);

  useEffect(() => {
    getEstimation();
  }, [estimationStream]);

  useEffect(() => {

    const voteSubscription = voteService
      .changes("estimation_id", estimationId, getEstimation)
      .subscribe();

    setSubscriptions([voteSubscription]);

    return () => {
      subscriptions.forEach((sub) => sub.unsubscribe());
    };
  }, []);

  const onToggleVoteClick = (event: React.MouseEvent, active: boolean) => {
    if (estimationWithVotes) {
      estimationService.changeEstimationStatus(
        estimationWithVotes.session_id,
        estimationWithVotes.id!,
        active
      );
    }
  };

  const onDeleteClick = () => {
    estimationService.setAsDeleted(estimationId);
  };

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
              onClick={(e) => onToggleVoteClick(e, true)}
            />
            <Button
              icon="stop"
              disabled={!estimationWithVotes.isActive}
              negative={estimationWithVotes.isActive}
              content="Stop"
              onClick={(e) => onToggleVoteClick(e, false)}
            />
            <Button
              disabled={estimationWithVotes.isActive}
              icon="trash alternate"
              content="Delete"
              onClick={onDeleteClick}
            />
          </Button.Group>
        </Segment>
        {estimationWithVotes.description && (
          <Segment secondary textAlign="left">
            <ReactMarkdown children={estimationWithVotes.description} />
          </Segment>
        )}
        {!estimationWithVotes.isActive &&
          !!estimationWithVotes.Vote?.length && (
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
        {estimationWithVotes.Vote?.length > 0 && (
          <Segment>
            <div className="votes-table__cards">
              {estimationWithVotes.Vote.map((vote) => (
                <CardReveal
                  key={vote.id}
                  vote={vote}
                  shouldHide={estimationWithVotes.isActive}
                ></CardReveal>
              ))}
            </div>
          </Segment>
        )}
      </SegmentGroup>
    </div>
  ) : null;
};

export default VotesTable;