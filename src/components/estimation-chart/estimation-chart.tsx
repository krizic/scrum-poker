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

    const pieDataMap = Object.keys(props.estimation.votes).reduce((acc, current) => {
      const currentPieData = acc.get(
        this.props.estimation.votes[current].value
      );

      if (currentPieData) {
        currentPieData.value++;
        acc.set(this.props.estimation.votes[current].value, currentPieData);
      } else {
        acc.set(this.props.estimation.votes[current].value, {
          id: this.props.estimation.votes[current].value,
          value: 1,
          label: this.props.estimation.votes[current].value,
        });
      }
      debugger;
      return acc;
    }, new Map<string, PieDatum>());

    debugger;
    this.chartData = Array.from(pieDataMap.values());
  }

  sampleData = [
    {
      id: "go",
      label: "go",
      value: 395,
      color: "hsl(225, 70%, 50%)",
    },
    {
      id: "rust",
      label: "rust",
      value: 311,
      color: "hsl(119, 70%, 50%)",
    },
    {
      id: "sass",
      label: "sass",
      value: 342,
      color: "hsl(114, 70%, 50%)",
    },
    {
      id: "javascript",
      label: "javascript",
      value: 516,
      color: "hsl(211, 70%, 50%)",
    },
    {
      id: "elixir",
      label: "elixir",
      value: 430,
      color: "hsl(153, 70%, 50%)",
    },
  ];

  public render() {
    const component: React.ReactElement =
      this.props.estimation.votes &&
      Object.keys(this.props.estimation.votes).length ? (
        <Segment className="chart-container">
          <ResponsivePie
            data={this.chartData}
            margin={{top: 40, right: 80, bottom: 80, left: 80}}
            startAngle={90}
            endAngle={-90}
            sortByValue={true}
            padAngle={1}
            cornerRadius={5}
            radialLabelsSkipAngle={10}
            radialLabelsTextXOffset={6}
            radialLabelsTextColor="#333333"
            radialLabelsLinkOffset={0}
            radialLabelsLinkDiagonalLength={16}
            radialLabelsLinkHorizontalLength={24}
            radialLabelsLinkStrokeWidth={1}
            radialLabelsLinkColor={{from: "color"}}
            slicesLabelsSkipAngle={10}
            slicesLabelsTextColor="#333333"
            // animate={true}
            motionStiffness={90}
            // motionDamping={15}
            isInteractive={false}
            legends={[
              {
                anchor: "bottom",
                direction: "row",
                translateY: 56,
                itemWidth: 100,
                itemHeight: 18,
                itemTextColor: "#999",
                symbolSize: 18,
                symbolShape: "circle",
                effects: [
                  {
                    on: "hover",
                    style: {
                      itemTextColor: "#000",
                    },
                  },
                ],
              },
            ]}
          ></ResponsivePie>
        </Segment>
      ) : (
        <Segment>No votes available</Segment>
      );

    return component;
  }
}
