import TopMenu from '../../support/fragments/topMenu';
import TestTypes from '../../support/dictionary/testTypes';
import InventoryActions from '../../support/fragments/inventory/inventoryActions';
import FastAddNewRecord from '../../support/fragments/inventory/fastAddNewRecord';
import InventorySearchAndFilter from '../../support/fragments/inventory/inventorySearchAndFilter';
import ItemRecordView from '../../support/fragments/inventory/itemRecordView';
import InstanceRecordView from '../../support/fragments/inventory/instanceRecordView';
import InteractorsTools from '../../support/utils/interactorsTools';
import { getLongDelay } from '../../support/utils/cypressTools';
import permissions from '../../support/dictionary/permissions';
import Users from '../../support/fragments/users/users';
import DevTeams from '../../support/dictionary/devTeams';
import InventoryInstances from '../../support/fragments/inventory/inventoryInstances';
import InventoryInstance from '../../support/fragments/inventory/inventoryInstance';

describe('ui-inventory: Create fast add record', () => {
  const timeStamp = {
    start: null,
    end: null,
  };
  let userId;

  beforeEach(() => {
    cy
      .createTempUser([
        permissions.inventoryAll.gui,
        permissions.uiInventorySettingsFastAdd.gui
      ])
      .then(userProperties => {
        userId = userProperties.userId;
        cy.login(userProperties.username, userProperties.password);

        cy.intercept('POST', '/inventory/instances').as('createInstance');
        cy.intercept('POST', '/holdings-storage/holdings').as('createHolding');
        cy.intercept('POST', '/inventory/items').as('createItem');

        FastAddNewRecord.updateInventoryFastAddSetting(
          FastAddNewRecord.fastAddNewRecordFormDetails.instanceStatusCodeOption
        );
        cy.visit(TopMenu.inventoryPath);
      });
  });

  afterEach('reset "Fast add" setting', () => {
    FastAddNewRecord.updateInventoryFastAddSetting(
      FastAddNewRecord.fastAddNewRecordFormDetails.defaultInstanceStatusCodeOption
    );
    InventoryInstances.deleteInstanceAndHoldingRecordAndAllItemsViaApi(FastAddNewRecord.fastAddNewRecordFormDetails.itemBarcode);
    Users.deleteViaApi(userId);
  });

  it('C15850 Create a fast add record from Inventory. Monograph. (folijet) (prokopovych)', { tags: [TestTypes.smoke, DevTeams.folijet] }, () => {
    InventoryActions.openNewFastAddRecordForm();
    FastAddNewRecord.waitLoading();
    FastAddNewRecord.fillFastAddNewRecordForm(FastAddNewRecord.fastAddNewRecordFormDetails);

    // set starting timestamp right before saving
    timeStamp.start = new Date();
    FastAddNewRecord.saveAndClose();

    cy.wait(['@createInstance', '@createHolding', '@createItem'], getLongDelay())
      .then(() => {
        // set ending timestamp after saving
        timeStamp.end = new Date();

        InteractorsTools.checkCalloutMessage(
          FastAddNewRecord.calloutMessages.INVENTORY_RECORDS_CREATE_SUCCESS
        );
        InventorySearchAndFilter.searchInstanceByTitle(FastAddNewRecord.fastAddNewRecordFormDetails.resourceTitle);
        FastAddNewRecord.openRecordDetails();

        // verify instance details
        FastAddNewRecord.verifyRecordCreatedDate(timeStamp);
        InstanceRecordView.verifyResourceTitle(FastAddNewRecord.fastAddNewRecordFormDetails.resourceTitle);
        InstanceRecordView.verifyInstanceStatusCode(
          FastAddNewRecord.fastAddNewRecordFormDetails.instanceStatusCodeValue
        );
        InstanceRecordView.verifyResourceType(
          FastAddNewRecord.fastAddNewRecordFormDetails.resourceType
        );

        // verify holdings details
        FastAddNewRecord.viewHoldings();
        FastAddNewRecord.verifyRecordCreatedDate(timeStamp);
        FastAddNewRecord.verifyPermanentLocation(
          FastAddNewRecord.fastAddNewRecordFormDetails.permanentLocationValue
        );
        FastAddNewRecord.closeHoldingsRecordView();

        // verify item details
        InventoryInstance.openHoldings([FastAddNewRecord.fastAddNewRecordFormDetails.permanentLocationValue]);
        InventoryInstance.openItemByBarcode(FastAddNewRecord.fastAddNewRecordFormDetails.itemBarcode);
        FastAddNewRecord.verifyRecordCreatedDate(timeStamp);
        ItemRecordView.verifyPermanentLoanType(FastAddNewRecord.fastAddNewRecordFormDetails.permanentLoanType);
        ItemRecordView.verifyItemBarcode(FastAddNewRecord.fastAddNewRecordFormDetails.itemBarcode);
        ItemRecordView.verifyNote(FastAddNewRecord.fastAddNewRecordFormDetails.note);
      });
  });
});
