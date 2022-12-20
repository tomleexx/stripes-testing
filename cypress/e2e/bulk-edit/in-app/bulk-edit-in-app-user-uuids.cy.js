import TopMenu from '../../../support/fragments/topMenu';
import testTypes from '../../../support/dictionary/testTypes';
import permissions from '../../../support/dictionary/permissions';
import BulkEditSearchPane from '../../../support/fragments/bulk-edit/bulk-edit-search-pane';
import FileManager from '../../../support/utils/fileManager';
import getRandomPostfix from '../../../support/utils/stringTools';
import devTeams from '../../../support/dictionary/devTeams';
import BulkEditActions from '../../../support/fragments/bulk-edit/bulk-edit-actions';
import Users from '../../../support/fragments/users/users';
import UsersSearchPane from '../../../support/fragments/users/usersSearchPane';
import UsersCard from '../../../support/fragments/users/usersCard';
import DateTools from '../../../support/utils/dateTools';

let user;
const userUUIDsFileName = `userUUIDs_${getRandomPostfix()}.csv`;
const matchRecordsFileName = `matchedRecords_${getRandomPostfix()}.csv`;

describe('bulk-edit', () => {
  describe('in-app approach', () => {
    before('create test data', () => {
      cy.createTempUser([
        permissions.bulkEditUpdateRecords.gui
      ])
        .then(userProperties => {
          user = userProperties;
          cy.login(user.username, user.password, { path: TopMenu.bulkEditPath, waiter: BulkEditSearchPane.waitLoading });
          FileManager.createFile(`cypress/fixtures/${userUUIDsFileName}`, user.userId);
        });
    });

    after('delete test data', () => {
      FileManager.deleteFile(`cypress/fixtures/${userUUIDsFileName}`);
      FileManager.deleteFile(`cypress/downloads/${matchRecordsFileName}`);
      Users.deleteViaApi(user.userId);
    });

    afterEach('open new bulk-edit form', () => {
      cy.visit(TopMenu.bulkEditPath);
    });

    it('C357579 Bulk edit: In app - Update user records permission enabled - Preview of records matched (firebird)', { tags: [testTypes.smoke, devTeams.firebird] }, () => {
      BulkEditSearchPane.selectRecordIdentifier('User UUIDs');

      BulkEditSearchPane.uploadFile(userUUIDsFileName);
      BulkEditSearchPane.waitFileUploading();

      BulkEditActions.downloadMatchedResults(matchRecordsFileName);

      BulkEditActions.openStartBulkEditForm();
      BulkEditActions.verifyBulkEditForm();
    });

    it('C357578 Verify "In app - Update user records" permission (firebird)', { tags: [testTypes.smoke, devTeams.firebird] }, () => {
      BulkEditSearchPane.verifyUsersUpdatePermission();
      BulkEditSearchPane.verifyRecordIdentifierItems();
      BulkEditSearchPane.verifyDragNDropUpdateUsersArea();

      BulkEditSearchPane.selectRecordIdentifier('User Barcodes');
      BulkEditSearchPane.verifyDragNDropUsersBarcodesArea();

      BulkEditSearchPane.selectRecordIdentifier('External IDs');
      BulkEditSearchPane.verifyDragNDropExternalIDsArea();

      BulkEditSearchPane.selectRecordIdentifier('Usernames');
      BulkEditSearchPane.verifyDragNDropUsernamesArea();
    });

    it('C357987 Verify Users Patron group bulk edit -- in app approach (firebird)', { tags: [testTypes.smoke, devTeams.firebird] }, () => {
      BulkEditSearchPane.selectRecordIdentifier('User UUIDs');

      BulkEditSearchPane.uploadFile(userUUIDsFileName);
      BulkEditSearchPane.waitFileUploading();

      BulkEditActions.openActions();
      BulkEditActions.openStartBulkEditForm();
      BulkEditActions.fillPatronGroup('graduate (Graduate Student)');
      BulkEditActions.confirmChanges();
      BulkEditActions.commitChanges();
      BulkEditSearchPane.waitFileUploading();

      cy.loginAsAdmin({ path: TopMenu.usersPath, waiter: UsersSearchPane.waitLoading });
      UsersSearchPane.searchByKeywords(user.username);
      UsersSearchPane.openUser(user.username);
      UsersCard.verifyPatronBlockValue('graduate');
    });

    it('C359213 Verify elements "Are you sure form?" -- Users-in app approach (firebird)', { tags: [testTypes.smoke, devTeams.firebird] }, () => {
      BulkEditSearchPane.selectRecordIdentifier('User UUIDs');

      BulkEditSearchPane.uploadFile(userUUIDsFileName);
      BulkEditSearchPane.waitFileUploading();

      BulkEditActions.openActions();
      BulkEditActions.openInAppStartBulkEditFrom();
      BulkEditActions.fillPatronGroup('staff (Staff Member)');

      BulkEditActions.confirmChanges();
      BulkEditActions.verifyAreYouSureForm(1, user.username);
      BulkEditActions.clickKeepEditingBtn();

      BulkEditActions.confirmChanges();
      BulkEditActions.commitChanges();
      BulkEditSearchPane.waitFileUploading();
      BulkEditActions.verifySuccessBanner(1);
      BulkEditSearchPane.verifyChangedResults('staff');
    });

    it('C359214 Verify expiration date updates in In-app approach (firebird)', { tags: [testTypes.smoke, devTeams.firebird] }, () => {
      const todayDate = DateTools.getCurrentDate();

      BulkEditSearchPane.selectRecordIdentifier('User UUIDs');

      BulkEditSearchPane.uploadFile(userUUIDsFileName);
      BulkEditSearchPane.waitFileUploading();

      BulkEditActions.openActions();
      BulkEditActions.openInAppStartBulkEditFrom();
      BulkEditActions.fillExpirationDate(todayDate);
      BulkEditActions.confirmChanges();
      BulkEditActions.commitChanges();
      BulkEditSearchPane.waitFileUploading();
      BulkEditActions.verifySuccessBanner(1);

      cy.loginAsAdmin({ path: TopMenu.usersPath, waiter: UsersSearchPane.waitLoading });
      UsersSearchPane.searchByKeywords(user.username);
      UsersSearchPane.openUser(user.username);
      UsersCard.verifyExpirationDate(todayDate);
    });

    it('C359237 Verify "Expiration date" option in the dropdown (firebird)', { tags: [testTypes.smoke, devTeams.firebird] }, () => {
      BulkEditSearchPane.selectRecordIdentifier('User UUIDs');

      BulkEditSearchPane.uploadFile(userUUIDsFileName);
      BulkEditSearchPane.waitFileUploading();

      BulkEditActions.openActions();
      BulkEditActions.openInAppStartBulkEditFrom();
      BulkEditActions.verifyCalendarItem();
    });

    it('C359585 Verify clicking on the "Commit changes" button (firebird)', { tags: [testTypes.smoke, devTeams.firebird] }, () => {
      BulkEditSearchPane.selectRecordIdentifier('User UUIDs');

      BulkEditSearchPane.uploadFile(userUUIDsFileName);
      BulkEditSearchPane.waitFileUploading();

      BulkEditActions.openActions();
      BulkEditActions.verifyCheckedDropdownMenuItem();
      BulkEditActions.verifyUncheckedDropdownMenuItem();

      BulkEditActions.openInAppStartBulkEditFrom();
      BulkEditActions.fillPatronGroup('graduate (Graduate Student)');
      BulkEditActions.confirmChanges();
      BulkEditActions.verifyAreYouSureForm(1, user.username);
      BulkEditActions.commitChanges();
      BulkEditSearchPane.waitFileUploading();
      BulkEditActions.verifySuccessBanner(1);
      BulkEditSearchPane.verifyChangedResults(user.username);
    });
  });
});
