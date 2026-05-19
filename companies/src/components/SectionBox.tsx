import React, { CSSProperties, ReactNode } from "react";
import "./SectionBox.scss";
import { textToTitleCase } from "../helpers/utils";
import { StylableProps } from "../helpers/props";

interface Props extends StylableProps {
  children: ReactNode;
  name?: string;
  /** Rendered beside the title (e.g. mixin schema info). */
  titleAccessory?: ReactNode;
  actions?: ReactNode;
  sectionStyles?: CSSProperties;
  sectionClassName?: string;
}

interface SectionBoxTitleProps extends StylableProps {
  name?: string;
  titleAccessory?: ReactNode;
  actions?: ReactNode;
}

export const SectionTitle = (props: SectionBoxTitleProps) => {
  const { className = "", name = "", titleAccessory, actions } = props;

  return (
    <div className={`section-title-wrapper ${className}`}>
      <div className="section-title-group flex align-items-center gap-2 flex-wrap">
        {name ? (
          <div className="section-title">{textToTitleCase(name)}</div>
        ) : null}
        {titleAccessory}
      </div>
      {actions && <div>{actions}</div>}
    </div>
  );
};

const SectionBox = (props: Props) => {
  const {
    children,
    name,
    titleAccessory,
    actions,
    sectionStyles,
    className = "",
    sectionClassName = "",
    style,
  } = props;

  return (
    <div style={style} className={`${className} section-box-wrapper`}>
      {(name || actions || titleAccessory) && (
        <SectionTitle
          className="mb-3"
          name={name}
          titleAccessory={titleAccessory}
          actions={actions}
        />
      )}
      <div
        data-test-id="section-box"
        className={`section-box ${sectionClassName}`}
        style={sectionStyles}
      >
        {children}
      </div>
    </div>
  );
};

export default SectionBox;
