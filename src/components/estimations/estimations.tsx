import * as React from "react";
import { Tab } from "semantic-ui-react";

import VotesTable from "../votes-table/votes-table";

import "./style.scss";
import { Estimation } from "../../api/model";
import { EstimationWithVotes } from "../../api";

export interface IEstimationsProps {
  estimationsWithVotes: EstimationWithVotes[];
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
    return this.props.estimationsWithVotes
      .sort((a, b) => {
        return a.created_at < b.created_at ? 1 : -1;
      })
      .map((estimation) => {
        return {
          menuItem: estimation.isActive
            ? `${estimation.name} - Active`
            : estimation.name,
          render: () => (
            <Tab.Pane className="tab-container">
              <VotesTable
                key={estimation.id}
                estimationWithVotes={estimation}
              ></VotesTable>
            </Tab.Pane>
          ),
        };
      });
  };

  public render() {
    return (
      <Tab
        menu={{
          pointing: true,
          renderActiveOnly: false,
          fluid: true,
          vertical: true,
        }}
        panes={this.mapEstimationsToPanes()}
      />
    );
  }
}
