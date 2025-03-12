import * as React from "react";
import { Statistic, List } from "semantic-ui-react";
import { IEstimation } from "../../api/interfaces";

import "./est-statistics.scss";
import { Vote } from "../../api/model";
import { EstimationWithVotes } from "../../api";

export interface IEstimationStatisticsProps {
  estimation: EstimationWithVotes;
}

export default class EstimationStatistics extends React.Component<IEstimationStatisticsProps> {
  estimationAverage: string;
  minMax: string;
  devsVoted: string;

  constructor(props) {
    super(props);

    this.devsVoted = this.getDevsVoted(this.props.estimation);
    this.minMax = this.getMinMax(this.props.estimation);
    this.estimationAverage = this.getEstimationAverage(this.props.estimation);
  }

  filterInvalidEstimations(estimation: EstimationWithVotes): Vote[] {
    return estimation.Vote.filter((current) => {
      return !isNaN(parseInt(current.value));
    });
  }

  getDevsVoted(estimation: EstimationWithVotes): string {
    const allDevs: number = Object.keys(estimation.Vote ?? {}).length;
    const devsVoted: number = this.filterInvalidEstimations(estimation).length;
    return `${devsVoted} / ${allDevs}`;
  }

  getMinMax(estimation: EstimationWithVotes): string {
    const minMax = this.filterInvalidEstimations(estimation).reduce(
      (acc, current) => {
        const currentValue: number = parseInt(current.value);
        if (acc.min === null || acc.max === null) {
          acc.min = currentValue;
          acc.max = currentValue;
        } else {
          acc.min = currentValue < acc.min ? currentValue : acc.min;
          acc.max = currentValue > acc.max ? currentValue : acc.max;
        }

        return acc;
      },
      { min: null, max: null }
    );
    return minMax.min !== null && minMax.max !== null
      ? `${minMax.min} - ${minMax.max}`
      : "n/a";
  }

  getEstimationAverage(estimation: EstimationWithVotes): string {
    const total = this.filterInvalidEstimations(estimation).reduce(
      (acc, current) => {
        acc.value = acc.value + parseInt(current.value);
        acc.count++;
        return acc;
      },
      { value: 0, count: 0 }
    );

    return total.count > 0 ? (total.value / total.count).toFixed(2) : "n/a";
  }

  public render() {
    return (
      <div className="est-statistics">
        <List divided relaxed>
          <List.Item>
            <List.Content>
              <Statistic>
                <Statistic.Value>{this.estimationAverage}</Statistic.Value>
                <Statistic.Label>Average</Statistic.Label>
              </Statistic>
            </List.Content>
          </List.Item>
          <List.Item>
            <List.Content>
              <Statistic>
                <Statistic.Value>{this.minMax}</Statistic.Value>
                <Statistic.Label>Min - Max</Statistic.Label>
              </Statistic>
            </List.Content>
          </List.Item>
          <List.Item>
            <List.Content>
              <Statistic>
                <Statistic.Value>{this.devsVoted}</Statistic.Value>
                <Statistic.Label>Voted</Statistic.Label>
              </Statistic>
            </List.Content>
          </List.Item>
        </List>
      </div>
    );
  }
}
