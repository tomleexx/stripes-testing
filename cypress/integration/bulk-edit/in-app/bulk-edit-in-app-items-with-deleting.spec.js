import TopMenu from '../../../support/fragments/topMenu';
import testTypes from '../../../support/dictionary/testTypes';
import permissions from '../../../support/dictionary/permissions';
import BulkEditSearchPane from '../../../support/fragments/bulk-edit/bulk-edit-search-pane';
import devTeams from '../../../support/dictionary/devTeams';
import InventoryInstances from '../../../support/fragments/inventory/inventoryInstances';
import getRandomPostfix from '../../../support/utils/stringTools';
import FileManager from '../../../support/utils/fileManager';
import Users from '../../../support/fragments/users/users';
import BulkEditActions from '../../../support/fragments/bulk-edit/bulk-edit-actions';

let user;
const item = {
  instanceName: `testBulkEdit_${getRandomPostfix()}`,
  itemBarcode: getRandomPostfix(),
};
const itemToBeDeleted = {
  instanceName: `testBulkEdit_${getRandomPostfix()}`,
  itemBarcode: getRandomPostfix(),
};
const invalidItemBarcodesFileName = `C350905_invalidItemBarcodes_${getRandomPostfix()}.csv`;
const invalidBarcode = getRandomPostfix();

describe('bulk-edit', () => {
  before('create test data', () => {
    cy.createTempUser([
      permissions.bulkEditView.gui,
      permissions.bulkEditEdit.gui,
    ])
      .then(userProperties => {
        user = userProperties;
        cy.login(user.username, user.password, { path: TopMenu.bulkEditPath, waiter: BulkEditSearchPane.waitLoading });

        InventoryInstances.createInstanceViaApi(item.instanceName, item.itemBarcode);
        InventoryInstances.createInstanceViaApi(itemToBeDeleted.instanceName, itemToBeDeleted.itemBarcode);

        FileManager.createFile(`cypress/fixtures/${invalidItemBarcodesFileName}`, `${item.itemBarcode}\r\n${invalidBarcode}\r\n${itemToBeDeleted.itemBarcode}`);
      });
  });

  after('delete test data', () => {
    InventoryInstances.deleteInstanceViaApi(item.itemBarcode);
    Users.deleteViaApi(user.userId);
    FileManager.deleteFile(`cypress/fixtures/${invalidItemBarcodesFileName}`);
  });

  it('C353230 Verify completion of the in-app bulk edit (firebird)', { tags: [testTypes.smoke, devTeams.firebird] }, () => {
    BulkEditSearchPane.selectRecordIdentifier('Item barcode');

    BulkEditSearchPane.uploadFile(invalidItemBarcodesFileName);
    BulkEditSearchPane.waitFileUploading();

    BulkEditActions.openActions();
    BulkEditActions.openStartBulkEditForm();
    BulkEditActions.replaceTemporaryLocation();
    BulkEditActions.confirmChanges();

    InventoryInstances.deleteInstanceViaApi(itemToBeDeleted.itemBarcode);

    BulkEditActions.saveAndClose();
    BulkEditSearchPane.waitFileUploading();

    BulkEditSearchPane.verifyNonMatchedResults(invalidBarcode);
    BulkEditActions.verifyActionAfterChangingRecords();
    BulkEditSearchPane.verifyErrorLabelAfterChanges(invalidItemBarcodesFileName, 1, 1);
    BulkEditActions.verifySuccessBanner(1);
    BulkEditActions.newBulkEdit();
  });
});
