import * as React from "react";
import { Segment } from "semantic-ui-react";
import { ResponsivePie, DefaultRawDatum } from "@nivo/pie";
import "./estimation-chart.scss";

import { IEstimation } from "../../api/interfaces";

export interface IEstimationChartProps {
  estimation: IEstimation;
}

export interface IEstimationChartState {}

interface PieData extends DefaultRawDatum {
  label: string;
}
export default class EstimationChart extends React.Component<
  IEstimationChartProps,
  IEstimationChartState
> {
  chartData: PieData[];

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
      new Map<string, PieData>()
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
            margin={{ top: 20, right: 0, bottom: 0, left: 80 }}
            endAngle={-90}
            sortByValue={true}
            cornerRadius={14}
            colors={{ scheme: "nivo" }}
            borderColor={{
              from: "color",
              modifiers: [["darker", 0.2]],
            }}
            arcLinkLabelsTextOffset={10}
            arcLinkLabelsTextColor="#333333"
            arcLinkLabelsStraightLength={36}
            arcLinkLabelsThickness={4}
            arcLinkLabelsColor={{ from: "color" }}
            arcLabelsRadiusOffset={0.9}
            arcLabelsTextColor={{
              from: "color",
              modifiers: [["darker", 3]],
            }}
            defs={[
              {
                id: "dots",
                type: "patternDots",
                background: "inherit",
                color: "rgba(255, 255, 255, 0.3)",
                size: 4,
                padding: 1,
                stagger: true,
              },
              {
                id: "lines",
                type: "patternLines",
                background: "inherit",
                color: "rgba(255, 255, 255, 0.3)",
                rotation: -45,
                lineWidth: 6,
                spacing: 10,
              },
            ]}
            fill={[
              {
                match: {
                  id: "ruby",
                },
                id: "dots",
              },
              {
                match: {
                  id: "c",
                },
                id: "dots",
              },
              {
                match: {
                  id: "go",
                },
                id: "dots",
              },
              {
                match: {
                  id: "python",
                },
                id: "dots",
              },
              {
                match: {
                  id: "scala",
                },
                id: "lines",
              },
              {
                match: {
                  id: "lisp",
                },
                id: "lines",
              },
              {
                match: {
                  id: "elixir",
                },
                id: "lines",
              },
              {
                match: {
                  id: "javascript",
                },
                id: "lines",
              },
            ]}
            legends={[
              {
                anchor: "bottom",
                direction: "row",
                justify: false,
                translateX: 0,
                translateY: 56,
                itemsSpacing: 0,
                itemWidth: 100,
                itemHeight: 18,
                itemTextColor: "#999",
                itemDirection: "left-to-right",
                itemOpacity: 1,
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
