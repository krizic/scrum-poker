import * as React from "react";
import {Statistic, List} from "semantic-ui-react";
import {IEstimation} from "../../api/interfaces";

import "./est-statistics.scss";

export interface IEstimationStatisticsProps {
  estimation: IEstimation;
}

export default class EstimationStatistics extends React.Component<
  IEstimationStatisticsProps
> {
  estimationAverage: string;
  minMax: string;
  devsVoted: string;

  constructor(props) {
    super(props);

    this.devsVoted = this.getDevsVoted(this.props.estimation);
    this.minMax = this.getMinMax(this.props.estimation);
    this.estimationAverage = this.getEstimationAverage(this.props.estimation);
  }

  filterInvalidEstimations(estimation: IEstimation): string[] {
    return Object.keys(estimation.votes ?? {}).filter((current) => {
      return !isNaN(parseInt(estimation.votes[current].value));
    });
  }

  getDevsVoted(estimation: IEstimation): string {
    const allDevs: number = Object.keys(estimation.votes ?? {}).length;
    const devsVoted: number = this.filterInvalidEstimations(estimation).length;
    return `${devsVoted} / ${allDevs}`;
  }

  getMinMax(estimation: IEstimation): string {
    const minMax = this.filterInvalidEstimations(estimation).reduce(
      (acc, current) => {
        const currentValue: number = parseInt(estimation.votes[current].value);
        if (acc.min === null || acc.max === null) {
          acc.min = currentValue;
          acc.max = currentValue;
        } else {
          acc.min = currentValue < acc.min ? currentValue : acc.min;
          acc.max = currentValue > acc.max ? currentValue : acc.max;
        }

        return acc;
      },
      {min: null, max: null}
    );
    return `${minMax.min} - ${minMax.max}`;
  }

  getEstimationAverage(estimation: IEstimation): string {
    const total = this.filterInvalidEstimations(estimation).reduce(
      (acc, current) => {
        acc.value = acc.count + parseInt(estimation.votes[current].value);
        acc.count++;
        return acc;
      },
      {value: 0, count: 0}
    );

    return (total.value / total.count).toFixed(2);
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
