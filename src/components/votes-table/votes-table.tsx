import * as React from "react";
import {Button, Segment, SegmentGroup} from "semantic-ui-react";

import "./votes-table.scss";
import {IEstimation} from "../../api/interfaces";
import {ApiService} from "../../api";
import CardReveal from "../card-reveal/card-reveal";

export interface IVotesTableProps {
  estimate: IEstimation;
  documentRef: {_id: string; _rev: string};
}

export interface IVotesTableState {}

export default class VotesTable extends React.Component<
  IVotesTableProps,
  IVotesTableState
> {
  readonly api: ApiService = ApiService.Instance;

  constructor(props: IVotesTableProps) {
    super(props);
    this.state = {};
  }

  onToggleVoteClick = (event: React.MouseEvent, active: boolean) => {
    const newEstimate: IEstimation = {...this.props.estimate, isActive: active};
    this.api.updateEstimation(this.props.documentRef, newEstimate);
  };

  onDeleteClick = (e: React.MouseEvent) => {
    this.api.deleteEstimation(this.props.documentRef, this.props.estimate.id!);
  };

  public render() {
    return (
      <div className="votes-table">
        <SegmentGroup>
          <Segment secondary textAlign="center">
            <Button.Group>
              <Button
                circular
                icon="play"
                color={!this.props.estimate.isActive ? "blue" : undefined}
                disabled={this.props.estimate.isActive}
                content="Start"
                onClick={(e) => {
                  this.onToggleVoteClick(e, true);
                }}
              />
              <Button
                icon="stop"
                disabled={!this.props.estimate.isActive}
                negative={this.props.estimate.isActive}
                content="Stop"
                onClick={(e) => {
                  this.onToggleVoteClick(e, false);
                }}
              />
              <Button
                disabled={this.props.estimate.isActive}
                icon="trash alternate"
                content="Delete"
                onClick={this.onDeleteClick}
              />
            </Button.Group>
          </Segment>

          <Segment>
            <div className="votes-table__cards">
              {Object.keys(this.props.estimate.votes).map((voteKey) => {
                return (
                  <CardReveal
                    vote={this.props.estimate.votes[voteKey]}
                    shouldHide={this.props.estimate.isActive}
                  ></CardReveal>
                );
              })}
            </div>
          </Segment>
        </SegmentGroup>
      </div>
    );
  }
}
