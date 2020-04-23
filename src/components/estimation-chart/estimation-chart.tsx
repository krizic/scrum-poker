import * as React from "react";
import {Segment} from "semantic-ui-react";
import {ResponsivePie, PieDatum} from "@nivo/pie";
import "./estimation-chart.scss";

import {IEstimation} from "../../api/interfaces";

export interface IEstimationChartProps {
  estimation: IEstimation;
}

export interface IEstimationChartState {}

export default class EstimationChart extends React.Component<
  IEstimationChartProps,
  IEstimationChartState
> {
  chartData: PieDatum[];

  constructor(props: IEstimationChartProps) {
    super(props);

    this.state = {};

    const pieDataMap = Object.keys(props.estimation.votes).reduce(
      (acc, current) => {
        const voteValue =
          this.props.estimation.votes[current].value ?? "no-vote";

        const currentPieData = acc.get(voteValue);

        if (currentPieData) {
          currentPieData.value++;
          acc.set(voteValue, currentPieData);
        } else {
          acc.set(voteValue, {
            id: voteValue,
            value: 1,
            label: voteValue,
          });
        }
        return acc;
      },
      new Map<string, PieDatum>()
    );

    this.chartData = Array.from(pieDataMap.values());
  }

  public render() {
    const component: React.ReactElement =
      this.props.estimation.votes &&
      Object.keys(this.props.estimation.votes).length ? (
        <Segment className="chart-container">
          <ResponsivePie
            data={this.chartData}
            margin={{top: 20, right: 0, bottom: 0, left: 80}}
            startAngle={-90}
            endAngle={0}
            sortByValue={true}
            padAngle={1}
            cornerRadius={5}
            radialLabelsSkipAngle={10}
            radialLabelsTextXOffset={6}
            radialLabelsTextColor="#000000"
            radialLabelsLinkOffset={0}
            radialLabelsLinkDiagonalLength={16}
            radialLabelsLinkHorizontalLength={24}
            radialLabelsLinkStrokeWidth={1}
            radialLabelsLinkColor={{from: "color"}}
            slicesLabelsSkipAngle={10}
            slicesLabelsTextColor="#000000"
            // animate={true}
            motionStiffness={90}
            // motionDamping={15}
            isInteractive={false}
          ></ResponsivePie>
        </Segment>
      ) : (
        <Segment>No votes available</Segment>
      );

    return component;
  }
}
