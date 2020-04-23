import * as React from "react";
import {Reveal} from "semantic-ui-react";
import PokerCard from "../poker-card/poker-card";

import style from "./style.module.scss";
import {IVote} from "../../api/interfaces";

export interface ICardRevealProps {
  shouldHide: boolean;
  withProfilePic?: boolean;
  vote: IVote;
}

export default class CardReveal extends React.Component<ICardRevealProps> {
  public render() {
    return (
      <Reveal
        disabled={this.props.shouldHide}
        active={!this.props.shouldHide}
        animated="move"
        style={{pointerEvents: "none"}}
        className={style.container}
        instant={this.props.shouldHide}
      >
        <Reveal.Content style={{lineHeight: 0}} visible>
          <PokerCard
            withProfilePic
            side="back"
            loading={!this.props.vote?.value}
            voterEmail={this.props.vote.voter_email}
            voterUsername={this.props.vote.voter_username}
            voterPattern={this.props.vote.pattern}
          >
            <div>{this.props.vote.voter_username}</div>
          </PokerCard>
        </Reveal.Content>
        <Reveal.Content style={{lineHeight: 0}} hidden>
          <PokerCard
            withProfilePic
            side="front"
            voterEmail={this.props.vote.voter_email}
            voterUsername={this.props.vote.voter_username}
            voteValue={this.props.shouldHide ? "?" : this.props.vote.value}
          ></PokerCard>
        </Reveal.Content>
      </Reveal>
    );
  }
}
