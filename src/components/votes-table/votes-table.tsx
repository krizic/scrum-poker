import * as React from "react";
import {Button, Segment, SegmentGroup, List} from "semantic-ui-react";

import "./votes-table.scss";
import {IEstimation} from "../../api/interfaces";
import {ApiService} from "../../api";
import CardReveal from "../card-reveal/card-reveal";
import EstimationChart from "../estimation-chart/estimation-chart";

export interface IVotesTableProps {
  estimation: IEstimation;
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
    const newEstimate: IEstimation = {
      ...this.props.estimation,
      isActive: active,
    };
    this.api.updateEstimation(this.props.documentRef, newEstimate);
  };

  onDeleteClick = (e: React.MouseEvent) => {
    this.api.deleteEstimation(
      this.props.documentRef,
      this.props.estimation.id!
    );
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
                color={!this.props.estimation.isActive ? "blue" : undefined}
                disabled={this.props.estimation.isActive}
                content="Start"
                onClick={(e) => {
                  this.onToggleVoteClick(e, true);
                }}
              />
              <Button
                icon="stop"
                disabled={!this.props.estimation.isActive}
                negative={this.props.estimation.isActive}
                content="Stop"
                onClick={(e) => {
                  this.onToggleVoteClick(e, false);
                }}
              />
              <Button
                disabled={this.props.estimation.isActive}
                icon="trash alternate"
                content="Delete"
                onClick={this.onDeleteClick}
              />
            </Button.Group>
          </Segment>
          {!this.props.estimation.isActive && (
            <Segment.Group horizontal>
              <EstimationChart
                estimation={this.props.estimation}
              ></EstimationChart>
              <Segment>
                <List divided relaxed>
                  <List.Item>
                    <List.Icon
                      name="github"
                      size="large"
                      verticalAlign="middle"
                    />
                    <List.Content>
                      <List.Header as="a">Semantic-Org/Semantic-UI</List.Header>
                      <List.Description as="a">
                        Updated 10 mins ago
                      </List.Description>
                    </List.Content>
                  </List.Item>
                  <List.Item>
                    <List.Icon
                      name="github"
                      size="large"
                      verticalAlign="middle"
                    />
                    <List.Content>
                      <List.Header as="a">
                        Semantic-Org/Semantic-UI-Docs
                      </List.Header>
                      <List.Description as="a">
                        Updated 22 mins ago
                      </List.Description>
                    </List.Content>
                  </List.Item>
                  <List.Item>
                    <List.Icon
                      name="github"
                      size="large"
                      verticalAlign="middle"
                    />
                    <List.Content>
                      <List.Header as="a">
                        Semantic-Org/Semantic-UI-Meteor
                      </List.Header>
                      <List.Description as="a">
                        Updated 34 mins ago
                      </List.Description>
                    </List.Content>
                  </List.Item>
                </List>
              </Segment>
            </Segment.Group>
          )}
          <Segment>
            <div className="votes-table__cards">
              {Object.keys(this.props.estimation.votes).map((voteKey) => {
                return (
                  <CardReveal
                    vote={this.props.estimation.votes[voteKey]}
                    shouldHide={this.props.estimation.isActive}
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
