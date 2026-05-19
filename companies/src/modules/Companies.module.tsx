import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import HeaderSection from "../components/shared/HeaderSection";
import usePagination from "../hooks/usePagination";
import { Column, ColumnProps } from "primereact/column";
import { useCustomerManagementApi } from "../api/customerManagement";
import { CompanyType, LegalEntity } from "../models/LegalEntity";
import { formatCustomerName } from "../helpers/utils";
import { Button } from "primereact/button";
import { useRefresh } from "../context/RefreshValuesProvider";
import { Dropdown } from "primereact/dropdown";
import BatchDeleteButton from "../components/shared/BatchDeleteButton";
import { useUIBlocker } from "../context/UIBlcoker";
import useCustomNavigate from "../hooks/useCustomNavigate";
import { usePermissions } from "../context/PermissionsProvider";
import { EmployeeDomains } from "../configs/accessControls";
import { useTenant } from "../context/TenantProvider";
import MdDataTable from "../components/MdDataTable";
import { TableExtensions } from "components/TableExtensions";
import { SchemaType } from "models/Schema";
import { useConfiguration } from "context/ConfigurationProvider";
import { useLocalizedValue } from "hooks/useLocalizedValue";
import { DisplayMixin, parseColumnProps } from "models/DisplayMixin";
import { LegalEntityActions } from "../components/companies/LegalEntityActions";
import { useToast } from "../context/ToastProvider";

const TABLE_NAME = "companies";
const TABLE_NAME_CONFIG_KEY = "ext_companies";

export default function CompaniesModule() {
  const {
    paginationParams,
    totalCount,
    onPageCallback,
    onFilterCallback,
    onSortCallback,
    setFilters,
    setTotalCount,
  } = usePagination();
  const { i18n, t } = useTranslation();
  const { getTableMixinColumns, tableConfigurations, fetchVisibleColumns } =
    useConfiguration();
  const { getUiLangValue } = useLocalizedValue();
  const [selected, setSelected] = useState<LegalEntity[]>([]);
  const [tableData, setTableData] = useState<LegalEntity[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const { navigate } = useCustomNavigate();
  const { refresh, setRefreshValue } = useRefresh();
  const { blockPanel } = useUIBlocker();
  const { tenant } = useTenant();
  const [visibleMixins, setVisibleMixins] = useState<DisplayMixin[]>(
    getTableMixinColumns(TABLE_NAME_CONFIG_KEY),
  );
  const { getLegalEntities, deleteLegalEntity } = useCustomerManagementApi();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission(EmployeeDomains.COMPANIES_MANAGER);
  const [isLoading, setIsLoading] = useState(true);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- mirrors MD; derives column visibility from configuration */
    setVisibleColumns(fetchVisibleColumns(TABLE_NAME_CONFIG_KEY));
    setVisibleMixins(getTableMixinColumns(TABLE_NAME_CONFIG_KEY));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [tableConfigurations]);

  useEffect(() => {
    (async () => {
      try {
        const { values, totalRecords } =
          await getLegalEntities(paginationParams);
        setTableData(values);
        setTotalCount(totalRecords);
      } catch (e: any) {
        showError(
          t("companies.toasts.errorLoad"),
          e.response.data.details || e.response.data.message,
        );
        console.error("Error fetching legal entities:", e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [i18n.language, paginationParams, refresh, tenant]);

  const companyTypeFilter = useCallback((options: any) => {
    const handleChange = (e: any) => {
      options.filterApplyCallback(e.value, options.index);
    };
    const handleClear = () => {
      options.filterApplyCallback("", options.index);
    };

    return (
      <div style={{ display: "flex", alignItems: "center" }}>
        <Dropdown
          appendTo="self"
          className="w-full"
          options={[
            { label: "Subsidiary", value: CompanyType.SUBSIDIARY },
            { label: "Company", value: CompanyType.COMPANY },
          ]}
          value={options.value}
          onChange={(e) => handleChange(e)}
        />
        {options.value && (
          <button
            onClick={handleClear}
            className="p-column-filter-clear-button p-link"
            type="button"
            aria-label="Clear"
          >
            <span className="pi pi-filter-slash" aria-hidden="true"></span>
          </button>
        )}
      </div>
    );
  }, []);

  const batchDelete = useCallback(async () => {
    try {
      setIsDeleting(true);
      blockPanel(true);
      await Promise.all(
        selected.map((le: LegalEntity) => {
          return deleteLegalEntity(le.id);
        }),
      );
      setSelected([]);
      setRefreshValue();
      showSuccess(t("companies.toast.delete.title"));
    } catch (e: any) {
      showError(
        t("companies.toasts.errorDelete"),
        e.response.data.details || e.response.data.message,
      );
      console.error("Error during batch delete:", e);
    } finally {
      blockPanel(false);
      setIsDeleting(false);
    }
  }, [i18n.language, selected]);

  const columns = useMemo(() => {
    let rawColumns: ColumnProps[] = [
      {
        columnKey: "name",
        header: t(`${TABLE_NAME}.name`),
        field: "name",
        sortable: true,
        filter: true,
        showFilterMenu: false,
        showClearButton: false,
      },
      {
        columnKey: "type",
        header: t(`${TABLE_NAME}.type`),
        field: "type",
        filter: true,
        filterElement: companyTypeFilter,
        showFilterMenu: false,
        showClearButton: false,
      },
      {
        columnKey: "countryOfRegistration",
        field: "legalInfo.countryOfRegistration",
        filter: true,
        header: t(`${TABLE_NAME}.countryOfRegistration`),
        headerStyle: { width: "15%" },
        showFilterMenu: false,
        showClearButton: false,
      },
      {
        columnKey: "primaryContact",
        header: t(`${TABLE_NAME}.primaryContact`),
        body: (rowData: LegalEntity) => {
          if (!rowData.contacts || rowData.contacts.length === 0) {
            return "-";
          } else {
            const primaryContact = rowData.contacts?.filter(
              (contact) => contact.primary,
            )[0];
            return primaryContact
              ? formatCustomerName(primaryContact.customer)
              : formatCustomerName(rowData.contacts[0].customer);
          }
        },
      },
    ].map((col) => {
      const hidden =
        visibleColumns.length > 0
          ? !visibleColumns.includes(col.columnKey || "")
          : false;
      return {
        ...col,
        hidden,
      };
    }) as ColumnProps[];

    rawColumns = [
      ...rawColumns,
      ...visibleMixins.map((mixin) => ({
        ...parseColumnProps(mixin, getUiLangValue),
      })),
    ];

    rawColumns.push({
      columnKey: "actions",
      headerStyle: { width: "180px" },
      body: (rowData: LegalEntity) => {
        return (
          <LegalEntityActions
            managerPermissions={canManage}
            legalEntity={rowData}
          />
        );
      },
    });

    return rawColumns;
  }, [
    TABLE_NAME,
    i18n.language,
    canManage,
    visibleMixins,
    visibleColumns,
    getUiLangValue,
    t,
    companyTypeFilter,
  ]);

  useEffect(() => {
    setFilters(columns);
  }, [columns, setFilters]);

  return (
    <div className="module">
      <HeaderSection
        title={t("companies.plural")}
        moduleActions={
          <Button
            className="p-button"
            onClick={() => navigate("/apps/management/companies/add")}
            disabled={!canManage}
          >
            {t("companies.addNewCompany")}
          </Button>
        }
      />
      <div className="flex justify-content-between mb-2 w-full">
        <BatchDeleteButton
          selected={selected}
          onDelete={batchDelete}
          isDeleting={isDeleting}
          pluralsPath="companies"
          disabled={!canManage}
        />
        <TableExtensions
          tableConfigurationKey={TABLE_NAME_CONFIG_KEY}
          tableColumns={columns
            .filter((column) => Object.hasOwn(column, "hidden"))
            .map((column) => column.columnKey ?? "")}
          tableName={TABLE_NAME}
          schemaType={SchemaType.COMPANY}
          managerPermission={canManage}
        />
      </div>
      <MdDataTable
        dataKey="id"
        value={tableData}
        isLoading={isLoading}
        selection={selected}
        onRowClick={(data) => {
          navigate(`/apps/management/companies/${data.id}`);
        }}
        setSelectedItems={setSelected}
        paginationOptions={{
          first: paginationParams.first,
          filters: paginationParams.filters,
          totalRecords: totalCount,
          rows: paginationParams.rows,
        }}
        sortField={paginationParams.sortField}
        sortOrder={paginationParams.sortOrder}
        lazy={true}
        onSort={onSortCallback}
        onPage={onPageCallback}
        onFilter={onFilterCallback}
      >
        <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
        {columns.map((column: ColumnProps) => {
          return (
            <Column key={column.columnKey ?? column.field} {...column} />
          );
        })}
      </MdDataTable>
    </div>
  );
}
