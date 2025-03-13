import * as React from "react";
import { Segment, Divider } from "semantic-ui-react";
import PokerCard from "../poker-card/poker-card";
import "./dev-estimation.scss";
import ReactMarkdown from "react-markdown";
import { EstimationService } from "../../api";
import { EstimationWithPlayerVote, VoteService } from "../../api/services";
import { Player, Session } from "../../api/model";
import { RealtimeChannel } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";

export interface IDevEstimationProps {
  session: Session;
  user: Player;
}

const DevEstimation: React.FC<IDevEstimationProps> = ({ session, user }) => {
  const cardValues: string[] = [
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

  const [activeEstimation, setActiveEstimation] = useState<
    EstimationWithPlayerVote | undefined
  >(undefined);
  const [currentSelectedVote, setCurrentSelectedVote] = useState<
    string | undefined
  >(undefined);
  const [onLoading, setOnLoading] = useState<string | undefined>(undefined);
  const [voteId, setVoteId] = useState<string | undefined>(undefined);

  const estimationService = new EstimationService();
  const voteService = new VoteService();

  useEffect(() => {
    onActiveEstimationChange();
    const estimationSub = estimationService
      .changes("session_id", session.id, onActiveEstimationChange)
      .subscribe();

    const subscriptions: RealtimeChannel[] = [];
    subscriptions.push(estimationSub);

    return () => {
      subscriptions.forEach((subscription) => {
        subscription.unsubscribe();
      });
    };
  }, []);

  const fetchActiveEstimation = useCallback(async () => {
    const activeEstimation =
      await estimationService.getActiveEstimationWithPlayerVote(
        session.id,
        user.id
      );
    if (!activeEstimation) {
      setActiveEstimation(undefined);
    } else {
      const currentSelectedVote = activeEstimation.Vote.find(
        (vote) => vote.player_id === user.id
      )?.value;

      setActiveEstimation(activeEstimation);
      setCurrentSelectedVote(currentSelectedVote);
    }
  }, [session.id, user.id]);

  const initializeVoteObject = useEffect(() => {
    debugger;
    if (activeEstimation) {
      if (activeEstimation.Vote.length === 0) {
        voteService
          .create({
            estimation_id: activeEstimation.id,
            player_id: user.id,
          })
          .then((newEmptyVote) => {
            setVoteId(newEmptyVote.id);
          });
      } else {
        setVoteId(activeEstimation.Vote[0].id);
      }
    }
  }, [activeEstimation, user.id]);

  const onActiveEstimationChange = useCallback(async () => {
    await fetchActiveEstimation();
  }, [fetchActiveEstimation, initializeVoteObject]);

  const onCardSelected = async (value: string) => {
    if (voteId) {
      setOnLoading(value);
      await voteService.update(voteId, {
        estimation_id: activeEstimation!.id,
        player_id: user.id,
        value,
      });
      setOnLoading(undefined);
      await fetchActiveEstimation();
    }
  };

  return (
    <>
      <Segment.Group>
        <Segment secondary size="big">
          Session: {session.name}
        </Segment>

        {!activeEstimation && (
          <Segment padded="very" textAlign="center">
            No Active Estimation.
          </Segment>
        )}
      </Segment.Group>
      {activeEstimation && (
        <Segment.Group>
          <Segment color="violet">Story Name: {activeEstimation.name}</Segment>
          {activeEstimation.description && (
            <Segment secondary>
              Story Description:
              <Divider />
              <ReactMarkdown children={activeEstimation.description} />
            </Segment>
          )}
          <Segment>
            <div className="card-wrapper">
              {cardValues.map((value) => {
                return (
                  <PokerCard
                    isLoading={onLoading === value}
                    key={value}
                    onSelect={onCardSelected}
                    className={`dev-card ${
                      value === currentSelectedVote ? "selected" : ""
                    }`}
                    side="front"
                    voteValue={value}
                    voterUsername={user.username}
                  ></PokerCard>
                );
              })}
            </div>
          </Segment>
        </Segment.Group>
      )}
    </>
  );
};

export default DevEstimation;
