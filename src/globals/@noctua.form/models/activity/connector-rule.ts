import { ConnectorType } from './connector-activity';
import { noctuaFormConfig } from './../../noctua-form-config';

export class ConnectorRule {
  directness = noctuaFormConfig.directness.direct;
  effectDirection = noctuaFormConfig.effectDirection.positive;
  relationship;

  displaySection = {
    directness: true,
    effectDirection: true,
  };

  constructor(connectorType: ConnectorType) {

    switch (connectorType) {
      case (ConnectorType.ACTIVITY_ACTIVITY):
        this.relationship = noctuaFormConfig.activityRelationship.regulation;
        break;
      case (ConnectorType.ACTIVITY_MOLECULE):
        this.relationship = noctuaFormConfig.activityMoleculeRelationship.product;
        break;
      case (ConnectorType.MOLECULE_ACTIVITY):
        this.relationship = noctuaFormConfig.moleculeActivityRelationship.regulates;
        break;
    }
  }
}
