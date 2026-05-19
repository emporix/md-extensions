import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "primereact/button";
import { OverlayPanel } from "primereact/overlaypanel";

export type MixinSchemaInfoButtonProps = {
  schemaUrl?: string;
  schemaVersion?: number;
  newerSchemaUrl?: string;
  newerSchemaVersion?: number;
};

function MissingValue() {
  return <span className="text-color-secondary">—</span>;
}

function SchemaUrlLink({ url }: { url?: string }) {
  const trimmed = url?.trim();
  if (!trimmed) return <MissingValue />;
  if (/^https?:\/\//i.test(trimmed)) {
    return (
      <a
        href={trimmed}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary font-mono text-sm white-space-pre-wrap break-all"
      >
        {trimmed}
      </a>
    );
  }
  return (
    <span className="font-mono text-sm white-space-pre-wrap break-all">
      {trimmed}
    </span>
  );
}

/** Info control beside mixin section title — opens schema URL (link) and version details. */
const MixinSchemaInfoButton = (props: MixinSchemaInfoButtonProps) => {
  const { schemaUrl, schemaVersion, newerSchemaUrl, newerSchemaVersion } =
    props;
  const { t } = useTranslation();
  const overlayRef = useRef<OverlayPanel>(null);

  const hasDetails =
    schemaUrl != null ||
    schemaVersion != null ||
    newerSchemaUrl != null ||
    newerSchemaVersion != null;

  if (!hasDetails) return null;

  return (
    <span className="inline-flex align-items-center">
      <Button
        type="button"
        icon="pi pi-info-circle"
        className="p-button-text p-button-rounded p-button-sm p-1 shrink-0"
        aria-label={t("mixins.labels.schemaInfo")}
        tooltip={t("mixins.labels.schemaInfo")}
        tooltipOptions={{ position: "bottom" }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          overlayRef.current?.toggle(e);
        }}
      />
      <OverlayPanel
        ref={overlayRef}
        dismissable
        appendTo={typeof document !== "undefined" ? document.body : undefined}
        className="shadow-2"
        style={{ width: "min(28rem, calc(100vw - 2rem))", maxWidth: "28rem" }}
      >
        <div className="p-2">
          <div className="font-semibold text-sm mb-2">
            {t("mixins.labels.presentSchema")}
          </div>
          <div className="text-xs text-color-secondary mb-1">
            {t("mixins.labels.schemaUrl")}
          </div>
          <div className="mb-3">
            <SchemaUrlLink url={schemaUrl} />
          </div>
          <div className="text-xs text-color-secondary mb-1">
            {t("mixins.labels.schemaVersion")}
          </div>
          <div className="text-sm mb-3">
            {schemaVersion != null ? schemaVersion : <MissingValue />}
          </div>

          {(newerSchemaUrl != null || newerSchemaVersion != null) && (
            <>
              <hr className="my-2 border-top-1 surface-border" />
              <div className="font-semibold text-sm mb-2">
                {t("mixins.labels.newerSchema")}
              </div>
              <div className="text-xs text-color-secondary mb-1">
                {t("mixins.labels.schemaUrl")}
              </div>
              <div className="mb-3">
                <SchemaUrlLink url={newerSchemaUrl} />
              </div>
              <div className="text-xs text-color-secondary mb-1">
                {t("mixins.labels.schemaVersion")}
              </div>
              <div className="text-sm">
                {newerSchemaVersion != null ? (
                  newerSchemaVersion
                ) : (
                  <MissingValue />
                )}
              </div>
            </>
          )}
        </div>
      </OverlayPanel>
    </span>
  );
};

export default MixinSchemaInfoButton;
