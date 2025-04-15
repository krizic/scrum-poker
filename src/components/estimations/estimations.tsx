import * as React from "react";
import { Menu } from "primereact/menu";

import VotesTable from "../votes-table/votes-table";

import "./style.scss";
import { Estimation } from "../../api/model";
import { useEffect, useMemo, useState } from "react";
import { ListBox } from "primereact/listbox";
import { SelectItem } from "primereact/selectitem";

export interface IEstimationsProps {
  estimations: Estimation[];
  id: string;
}

export const Estimations: React.FC<IEstimationsProps> = ({ estimations }) => {
  const [selectedEstimationId, setSelectedEstimationId] = useState<
    Estimation["id"] | undefined
  >(undefined);

  useEffect(() => {
    if (estimations.length > 0) {
      const activeEstimations =
        estimations.find((estimation) => estimation.isActive) ?? estimations[0];
      setSelectedEstimationId(activeEstimations.id);
    }
  }, []);

  const labelCondenser = (label: string): string => {
    let isUrl = false;
    try {
      isUrl = Boolean(new URL(label));
    } catch (e) {
      isUrl = false;
    }
    if (isUrl) {
      const url = new URL(label);
      const jiraTicket = url.searchParams.get("selectedIssue");
      if (jiraTicket) {
        return jiraTicket;
      }
      return label.split("/").pop() || label;
    }
    return label;
  };

  const items: SelectItem[] = useMemo(() => {
    return estimations
      .map((estimation) => {
        const shortenedName = labelCondenser(estimation.name);
        return {
          value: estimation.id,
          label: estimation.isActive
            ? `${shortenedName} (active)`
            : shortenedName,
          icon: estimation.isActive
            ? "pi pi-fw pi-play"
            : estimation.isEnded
            ? "pi pi-fw pi-check"
            : "pi pi-fw",
        };
      })
      .sort((a, b) => {
        if (a.label < b.label) {
          return -1;
        }
        if (a.label > b.label) {
          return 1;
        }
        return 0;
      });
  }, [estimations]);

  return (
    <div className="grid">
      <div className="col-3">
        <ListBox
          filter
          itemTemplate={(item) => (
            <div className="flex align-items-center">
              <i className={item.icon} />
              <span className="ml-2">{item.label}</span>
            </div>
          )}
          options={items}
          optionLabel="label"
          optionValue="value"
          value={selectedEstimationId}
          onChange={(e) => {
            if (e.value) {
              setSelectedEstimationId(e.value);
            }
          }}
        />
      </div>
      <div className="col-9">
        {selectedEstimationId && (
          <VotesTable
            key={selectedEstimationId}
            estimationId={selectedEstimationId}
          ></VotesTable>
        )}
      </div>
    </div>
  );
};
