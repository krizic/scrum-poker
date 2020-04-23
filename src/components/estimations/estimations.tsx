import * as React from "react";
import {Tab} from "semantic-ui-react";

import {IEstimation} from "../../api/interfaces";
import VotesTable from "../votes-table/votes-table";

import "./style.scss";

export interface IEstimationsProps {
  estimations: {[key: string]: IEstimation};
  rev: string;
  id: string;
}

export interface IEstimationsState {
  panes?: any;
  initialRender: boolean;
}

export default class Estimations extends React.Component<
  IEstimationsProps,
  IEstimationsState
> {
  constructor(props: IEstimationsProps) {
    super(props);

    this.state = {
      initialRender: false,
    };
  }

  mapEstimationsToPanes = () => {
    return Object.keys(this.props.estimations)
      .sort((a, b) => {
        return this.props.estimations[a].timestamp <
          this.props.estimations[b].timestamp
          ? 1
          : -1;
      })
      .map((estimationKey, index) => {
        return {
          menuItem: this.props.estimations[estimationKey].isActive
            ? `${this.props.estimations[estimationKey].name} - Active`
            : this.props.estimations[estimationKey].name,
          render: () => (
            <Tab.Pane className="tab-container">
              <VotesTable key={estimationKey}
                documentRef={{_rev: this.props.rev, _id: this.props.id}}
                estimation={this.props.estimations[estimationKey]}
              ></VotesTable>
            </Tab.Pane>
          ),
        };
      });
  };

  public render() {
    return (
      <Tab
        menu={{pointing: true, renderActiveOnly:false, fluid: true, vertical: true}}
        panes={this.mapEstimationsToPanes()}
      />
    );
  }
}
