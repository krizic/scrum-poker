import * as React from "react";
import { Segment, Divider } from "semantic-ui-react";
import PokerCard from "../poker-card/poker-card";
import "./dev-estimation.scss";
import ReactMarkdown from "react-markdown";
import { Player, Session } from "../../api/model";
import { useEffect } from "react";
import {
  fetchActiveEstimationForPlayer,
  fetchEstimationBySessionId,
  fetchVoteByEstimationAndPlayer,
  selectCurrentSelectedPlayerEstimation,
  selectEstimationChangeStream,
  selectActiveEstimation,
  subscribeToEstimationChanges,
  useAppDispatch,
  useAppSelector,
  selectVote,
  selectVoteLoading,
  updateVote,
} from "../../store";

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

  const currentSelectedPlayerEstimation = useAppSelector(
    selectCurrentSelectedPlayerEstimation
  )(user.id);

  const activeEstimation = useAppSelector(selectActiveEstimation);
  const estimationChangeStream = useAppSelector(selectEstimationChangeStream);
  const playerVote = useAppSelector(selectVote);
  const isUpdateVoteLoading = useAppSelector(selectVoteLoading);

  const dispatch = useAppDispatch();

  useEffect(() => {
    // subscribe to the events in case there is no subscription active
    dispatch(subscribeToEstimationChanges(session.id));
    // get initial list of session estimations
    dispatch(fetchEstimationBySessionId(session.id));
  }, []);

  // react on estimation change stream
  useEffect(() => {
    if (estimationChangeStream) {
      const estimation = estimationChangeStream.new;
      if (estimation) {
        dispatch(fetchEstimationBySessionId(session.id));
      }
    }
  }, [estimationChangeStream]);

  //react on isActiveEstimation change
  useEffect(() => {
    if (activeEstimation !== undefined) {
      // fetch active estimation for player
      dispatch(
        fetchActiveEstimationForPlayer({
          sessionId: session.id,
          playerId: user.id,
        })
      );
      // fetch/initiate vote object
      dispatch(
        fetchVoteByEstimationAndPlayer({
          estimationId: activeEstimation.id,
          playerId: user.id,
        })
      );
    } 
  }, [activeEstimation]);


  const onActiveEstimationChange = () => {
    dispatch(
      fetchActiveEstimationForPlayer({
        sessionId: session.id,
        playerId: user.id,
      })
    );
  };
  const onCardSelected = async (value: string) => {
    if (playerVote) {
      dispatch(updateVote({value, voteId: playerVote.id}));
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
                    isLoading={isUpdateVoteLoading === value}
                    key={value}
                    onSelect={onCardSelected}
                    className={`dev-card ${
                      value === playerVote?.value
                        ? "selected"
                        : ""
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
