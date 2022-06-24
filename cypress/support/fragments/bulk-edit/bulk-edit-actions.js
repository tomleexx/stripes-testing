import { Button, HTML, including } from '@interactors/html';
import FileManager from '../../utils/fileManager';
import { Modal, SelectionOption } from '../../../../interactors';

const actionsBtn = Button('Actions');

export default {
  openStartBulkEditForm() {
    cy.do(Button(including('Start bulk edit')).click());
  },

  openActions() {
    cy.do(actionsBtn.click());
  },

  verifyActionAfterChangingRecords() {
    cy.do(actionsBtn.click());
    cy.expect([
      Button('Download changed records (CSV)').exists(),
      Button('Download errors (CSV)').exists(),
    ]);
  },

  verifySuccessBanner(validRecordsCount) {
    cy.expect(HTML(`${validRecordsCount} records have been successfully changed`).exists());
  },

  verifyLabel(text) {
    cy.expect(HTML(text).exists());
  },

  replaceTemporaryLocation() {
    // interactor doesn't allow to pick second the same select
    cy.get('select').eq(2).select('Replace with');
    cy.do([
      Button('Select control\nSelect location').click(),
      SelectionOption(including('Annex')).click(),
    ]);
  },

  confirmChanges() {
    cy.do(Button('Confirm changes').click());
  },

  saveAndClose() {
    cy.do(Button('Save & close').click());
  },

  downloadMatchedResults(fileName = 'matchedRecords.csv') {
    cy.do(actionsBtn.click());
    // It is necessary to avoid cypress reload page expecting
    cy.get('a[download]', { timeout: 15000 }).first().then(($input) => {
      cy.downloadFile($input.attr('href'), 'cypress/downloads', fileName);
    });
  },

  prepareBulkEditFileForImport(fileMask, finalFileName, stringToBeReplaced, replaceString) {
    FileManager.findDownloadedFilesByMask(`*${fileMask}*`).then((downloadedFilenames) => {
      const lastDownloadedFilename = downloadedFilenames.sort()[downloadedFilenames.length - 1];

      FileManager.readFile(lastDownloadedFilename)
        .then((actualContent) => {
          const content = actualContent.split('\n');
          content[2] = content[1].slice().replace(stringToBeReplaced, replaceString);
          FileManager.createFile(`cypress/fixtures/${finalFileName}`, content.join('\n'));
        });
    });
  },

  commitChanges() {
    cy.do([
      Modal().find(Button('Next')).click(),
      Modal().find(Button('Commit changes')).click()
    ]);
  },

  newBulkEdit() {
    cy.do(Button('New bulk edit').click());
  }
};
