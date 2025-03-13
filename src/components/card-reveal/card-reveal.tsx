import * as React from "react";
import { Reveal } from "semantic-ui-react";

import PokerCard from "../poker-card/poker-card";
import "./card-reveal.scss";
import { EstimationWithVotes } from "../../api";

export interface ICardRevealProps {
  shouldHide: boolean;
  withProfilePic?: boolean;
  vote: EstimationWithVotes["Vote"][0];
}

export default class CardReveal extends React.Component<ICardRevealProps> {
  public render() {
    return (
      <Reveal
        disabled={this.props.shouldHide}
        active={!this.props.shouldHide}
        animated="move"
        style={{ pointerEvents: "none" }}
        className={"card-reveal-container"}
        instant={this.props.shouldHide}
      >
        <Reveal.Content style={{ lineHeight: 0 }} visible>
          <PokerCard
            withProfilePic
            side="back"
            loading={!this.props.vote?.value}
            voterEmail={this.props.vote.Player.email}
            voterUsername={this.props.vote.Player.username}
            voterPattern={this.props.vote.Player.pattern}
          >
            <div>{this.props.vote.Player.username}</div>
          </PokerCard>
        </Reveal.Content>
        <Reveal.Content style={{ lineHeight: 0 }} hidden>
          <PokerCard
            withProfilePic
            side="front"
            voterEmail={this.props.vote.Player.email}
            voterUsername={this.props.vote.Player.username}
            voteValue={
              this.props.shouldHide ? "?" : this.props.vote.value ?? "-"
            }
          ></PokerCard>
        </Reveal.Content>
      </Reveal>
    );
  }
}
