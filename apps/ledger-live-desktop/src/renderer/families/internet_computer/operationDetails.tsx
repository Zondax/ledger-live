import { InternetComputerOperation } from "@ledgerhq/live-common/families/internet_computer/types";
import React from "react";
import { Trans } from "react-i18next";
import Ellipsis from "~/renderer/components/Ellipsis";
import {
  OpDetailsData,
  OpDetailsSection,
  OpDetailsTitle,
} from "~/renderer/drawers/OperationDetails/styledComponents";

type OperationDetailsExtraProps = {
  operation: InternetComputerOperation;
};

const OperationDetailsExtra = ({ operation }: OperationDetailsExtraProps) => {
  const { extra } = operation;
  return !extra.memo ? null : (
    <OpDetailsSection key={extra.memo}>
      <OpDetailsTitle>
        <Trans i18nKey={`operationDetails.extra.memo`} />
      </OpDetailsTitle>
      <OpDetailsData>
        <Ellipsis>{extra.memo}</Ellipsis>
      </OpDetailsData>
    </OpDetailsSection>
  );
};

export default {
  OperationDetailsExtra,
};
