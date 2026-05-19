import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { StylableProps } from "helpers/props";
import type { Customer } from "../../models/Customer";

function uniqueContactEmails(customers: Customer[]): {
  emails: string[];
  skippedNoEmail: number;
} {
  const seen = new Set<string>();
  const emails: string[] = [];
  let skippedNoEmail = 0;
  for (const c of customers) {
    const raw = c.contactEmail?.trim();
    if (!raw) {
      skippedNoEmail += 1;
      continue;
    }
    const key = raw.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    emails.push(raw);
  }
  return { emails, skippedNoEmail };
}

interface BatchEmailCustomersButtonProps extends StylableProps {
  selected: Customer[];
  disabled?: boolean;
}

/**
 * Opens a confirmation dialog then launches the system mail client with all unique
 * `contactEmail` values from the current selection (`mailto:`).
 */
const BatchEmailCustomersButton = (props: BatchEmailCustomersButtonProps) => {
  const { selected, disabled = false, className = "" } = props;
  const { t } = useTranslation();
  const [dialogVisible, setDialogVisible] = useState(false);

  const { emails, skippedNoEmail } = useMemo(
    () => uniqueContactEmails(selected),
    [selected],
  );

  const buttonDisabled =
    disabled || selected.length === 0 || emails.length === 0;

  const label = useMemo(() => {
    let text = t("customers.sendMailTo");
    if (selected.length > 0 && emails.length > 0) {
      text += ` (${emails.length})`;
    } else if (selected.length > 0) {
      text += ` (${selected.length})`;
    }
    return text;
  }, [selected.length, emails.length, t]);

  const noEmailsTooltip =
    !disabled && selected.length > 0 && emails.length === 0
      ? t("customers.batchEmail.noRecipientsTooltip")
      : undefined;

  const mailtoHref = useMemo(() => {
    if (emails.length === 0) return "";
    return `mailto:${emails.map((e) => encodeURIComponent(e)).join(",")}`;
  }, [emails]);

  const openMailClient = () => {
    if (!mailtoHref) return;
    window.location.href = mailtoHref;
    setDialogVisible(false);
  };

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
        label={t("customers.batchEmail.openMailClient")}
        icon="pi pi-envelope"
        onClick={openMailClient}
        disabled={emails.length === 0}
      />
    </div>
  );

  return (
    <>
      <Button
        type="button"
        className={`p-button-secondary-small ${className}`}
        label={label}
        icon="pi pi-envelope"
        disabled={buttonDisabled}
        title={noEmailsTooltip}
        onClick={() => setDialogVisible(true)}
      />
      <Dialog
        visible={dialogVisible}
        onHide={() => setDialogVisible(false)}
        header={t("customers.batchEmail.dialogTitle")}
        footer={footer}
        modal
        draggable={false}
        resizable={false}
        className="w-full"
        style={{ width: "min(520px, 94vw)" }}
      >
        <p className="mt-0 text-sm text-color-secondary line-height-3">
          {t("customers.batchEmail.dialogHint")}
        </p>
        {skippedNoEmail > 0 ? (
          <p className="text-sm text-color-secondary mb-3">
            {t("customers.batchEmail.skippedNoEmail", {
              count: skippedNoEmail,
            })}
          </p>
        ) : null}
        <div className="text-xs text-color-secondary mb-1">
          {t("customers.batchEmail.recipientListCaption", {
            count: emails.length,
          })}
        </div>
        <ul className="m-0 pl-4 overflow-auto max-h-[12rem] text-sm font-mono line-height-3 surface-ground border-round border-1 border-solid surface-border p-2">
          {emails.map((email) => (
            <li key={email}>{email}</li>
          ))}
        </ul>
      </Dialog>
    </>
  );
};

export default BatchEmailCustomersButton;
