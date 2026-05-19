import { ColumnFilterElementTemplateOptions } from "primereact/column";
import { Dropdown, DropdownChangeParams } from "primereact/dropdown";
import React from "react";

const DropdownFilterTemplate = (
  options: ColumnFilterElementTemplateOptions,
  menu: { label: string; value: unknown }[],
) => {
  return (
    <Dropdown
      value={options.value}
      showClear={true}
      options={menu}
      onChange={(e: DropdownChangeParams) => {
        options.filterApplyCallback(e.value, options.index);
      }}
      className="p-column-filter"
      style={{ minWidth: "180px" }}
      panelClassName="p-dropdown-panel-dialog"
    />
  );
};

export default DropdownFilterTemplate;
