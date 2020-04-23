import * as React from "react";
import Gravatar from "react-gravatar";

import "./index.scss";
import {Dimmer, Loader} from "semantic-ui-react";

export interface IPokerCardProps {
  className?: string;
  voteValue?: string;
  voterUsername?: string;
  voterEmail?: string;
  side: "front" | "back";
  loading?: boolean;
  withProfilePic?: boolean;
  voterPattern?: string;
  onSelect?: (value: string) => any;
}

export interface IPokerCardState {}

class PokerCard extends React.Component<
  IPokerCardProps,
  IPokerCardState
> {
  static defaultProps: { voterPattern: string; };

  constructor(props: IPokerCardProps) {
    super(props);
    this.state = {};
  }

  onSelect = () => {
    if (this.props.onSelect) {
      this.props.onSelect(this.props.voteValue);
    }
  };

  public render() {
    const side =
      this.props.side === "front" ? (
        // front
        <div
          className={`componentFront ${this.props.className}`}
          onClick={this.onSelect}
        >
          <div className={"faceFront"}>
            <div className={"content"}>
              <div className={"valueFront"}>{this.props.voteValue}</div>
              {this.props.withProfilePic && (
                <div className={"labelFront"}>
                  <Gravatar
                    size={80}
                    className={"avatar"}
                    email={this.props.voterEmail}
                  />
                  <div>{this.props.voterUsername}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // back
        <div
          className={`componentBack ${this.props.className}`}
          onClick={this.onSelect}
          style={{backgroundImage: `url('/patterns/${this.props.voterPattern}.png')`}}
        >
          <div className={"faceBack"}>
            <div className={"content"}>
              {this.props.withProfilePic && (
                <div className={"labelFront"}>
                  <Gravatar
                    size={80}
                    className={"avatar"}
                    email={this.props.voterEmail}
                  />
                  <div className={"voterLabel"}>{this.props.children}</div>
                </div>
              )}
              <Dimmer active={this.props.loading}>
                {this.props.withProfilePic && (
                  <Gravatar
                    size={80}
                    className={"avatar"}
                    email={this.props.voterEmail}
                  />
                )}
                <div className={"voterLabel"}>{this.props.children}</div>
                <Loader active className="fit" />
              </Dimmer>
            </div>
          </div>
        </div>
      );

    return side;
  }
}


PokerCard.defaultProps = {
  voterPattern: "8126"
}

export default PokerCard;