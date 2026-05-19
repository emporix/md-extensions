import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { StylableProps } from "helpers/props";
import type { Customer } from "../../models/Customer";
import { useToast } from "../../context/ToastProvider";

function sanitizeCustomerForDisplay(c: Customer): Record<string, unknown> {
  const clone = JSON.parse(JSON.stringify(c)) as Record<string, unknown>;
  delete clone.password;
  return clone;
}

function customerPanelTitle(c: Customer, index: number): string {
  const name = `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim();
  if (name) return name;
  if (c.customerNumber) return c.customerNumber;
  if (c.id) return String(c.id);
  return `#${index + 1}`;
}

interface BatchCustomerJsonButtonProps extends StylableProps {
  selected: Customer[];
}

/**
 * Opens a dialog with pretty-printed JSON per selected row (password omitted).
 * Each customer is in an expandable panel; copy one or all.
 */
const BatchCustomerJsonButton = (props: BatchCustomerJsonButtonProps) => {
  const { selected, className = "" } = props;
  const { t } = useTranslation();
  const { showSuccess, showError } = useToast();
  const [dialogVisible, setDialogVisible] = useState(false);

  const perCustomerJson = useMemo(
    () =>
      selected.map((c) =>
        JSON.stringify(sanitizeCustomerForDisplay(c), null, 2),
      ),
    [selected],
  );

  const copyAllJson = useMemo(() => {
    if (selected.length === 0) return "";
    const sanitized = selected.map(sanitizeCustomerForDisplay);
    const data = sanitized.length === 1 ? sanitized[0] : sanitized;
    return JSON.stringify(data, null, 2);
  }, [selected]);

  const copyToClipboard = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        showSuccess(t("customers.batchJson.copied"));
      } catch {
        showError(t("customers.batchJson.copyFailed"));
      }
    },
    [showError, showSuccess, t],
  );

  const label = useMemo(() => {
    let text = t("customers.batchJson.button");
    if (selected.length > 0) {
      text += ` (${selected.length})`;
    }
    return text;
  }, [selected.length, t]);

  const footer = (
    <div className="flex gap-2 justify-content-end flex-wrap">
      <Button
        type="button"
        label={t("global.cancel")}
        className="p-button-text"
        onClick={() => setDialogVisible(false)}
      />
      <Button
        type="button"
        label={t("customers.batchJson.copyAll")}
        icon="pi pi-copy"
        onClick={() => void copyToClipboard(copyAllJson)}
        disabled={!copyAllJson}
      />
    </div>
  );

  return (
    <>
      <Button
        type="button"
        className={`p-button-secondary-small ${className}`}
        label={label}
        icon="pi pi-code"
        disabled={selected.length === 0}
        onClick={() => setDialogVisible(true)}
      />
      <Dialog
        visible={dialogVisible}
        onHide={() => setDialogVisible(false)}
        header={t("customers.batchJson.dialogTitle")}
        footer={footer}
        modal
        draggable={false}
        resizable={false}
        className="w-full"
        style={{ width: "min(960px, 96vw)" }}
      >
        <p className="mt-0 mb-3 text-sm text-color-secondary line-height-3">
          {t("customers.batchJson.dialogHint")}
        </p>
        <div className="flex flex-column gap-2 max-h-[70vh] overflow-y-auto pr-1">
          {selected.map((customer, index) => (
            <details
              key={customer.id ?? `row-${index}`}
              className="border-1 border-solid surface-border border-round overflow-hidden"
              open={selected.length === 1}
            >
              <summary className="cursor-pointer px-3 py-2 surface-ground font-medium">
                {customerPanelTitle(customer, index)}
              </summary>
              <div className="p-3 border-top-1 surface-border surface-card">
                <div className="flex justify-content-end mb-2">
                  <Button
                    type="button"
                    label={t("customers.batchJson.copyThisCustomer")}
                    icon="pi pi-copy"
                    className="p-button-sm p-button-outlined"
                    onClick={() =>
                      void copyToClipboard(perCustomerJson[index] ?? "")
                    }
                    disabled={!perCustomerJson[index]}
                  />
                </div>
                <pre className="m-0 p-3 border-round border-1 border-solid surface-border surface-ground overflow-auto max-h-[40vh] text-sm font-mono white-space-pre line-height-4">
                  {perCustomerJson[index]}
                </pre>
              </div>
            </details>
          ))}
        </div>
      </Dialog>
    </>
  );
};

export default BatchCustomerJsonButton;
