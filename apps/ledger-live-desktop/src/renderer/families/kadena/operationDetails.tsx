import { KadenaOperation } from "@ledgerhq/live-common/families/kadena/types";
import React from "react";
import { Trans } from "react-i18next";
import Ellipsis from "~/renderer/components/Ellipsis";
import {
  OpDetailsData,
  OpDetailsSection,
  OpDetailsTitle,
} from "~/renderer/drawers/OperationDetails/styledComponents";

type OperationDetailsExtraProps = {
  operation: KadenaOperation;
};

const OperationDetailsExtra = ({ operation }: OperationDetailsExtraProps) => {
  const { extra } = operation;
  return !extra.senderChainId ? null : (
    <OpDetailsSection key={extra.senderChainId}>
      <OpDetailsTitle>
        <Trans i18nKey={`operationDetails.extra.memo`} />
      </OpDetailsTitle>
      <OpDetailsData>
        <Ellipsis>{extra.senderChainId}</Ellipsis>
      </OpDetailsData>
    </OpDetailsSection>
  );
};

export default {
  OperationDetailsExtra,
};
