/// <reference types="cypress" />

import TopMenu from '../../support/fragments/topMenu';
import InventoryActions from '../../support/fragments/inventory/inventoryActions';
import InventoryInstance from '../../support/fragments/inventory/inventoryInstance';
import QuickMarcEditor from '../../support/fragments/quickMarcEditor';
import InventoryViewSource from '../../support/fragments/inventory/inventoryViewSource';
import InventoryInstanceEdit from '../../support/fragments/inventory/InventoryInstanceEdit';
import testTypes from '../../support/dictionary/testTypes';
import features from '../../support/dictionary/features';
import permissions from '../../support/dictionary/permissions';
import { replaceByIndex } from '../../support/utils/stringTools';
import { Callout } from '../../../interactors';
import Users from '../../support/fragments/users/users';
import DevTeams from '../../support/dictionary/devTeams';

// TODO: redesign test to exclude repeated steps
describe('Manage inventory Bib records with quickMarc editor', () => {
  let userId;
  const quickmarcEditor = new QuickMarcEditor(InventoryInstance.validOCLC);

  beforeEach(() => {
    // TODO: discuss with Khalilah required set of quickmarc permissions
    cy.createTempUser([permissions.uiQuickMarcQuickMarcAuthoritiesEditorAll.gui,
      permissions.uiQuickMarcQuickMarcEditorDuplicate.gui,
      permissions.uiQuickMarcQuickMarcBibliographicEditorAll.gui,
      permissions.inventoryAll.gui,
      permissions.uiInventorySingleRecordImport.gui,
    ]).then(userProperties => {
      userId = userProperties.userId;
      cy.login(userProperties.username, userProperties.password);
      cy.visit(TopMenu.inventoryPath);
      InventoryActions.import();
    });
  });

  it('C10950 Edit and save a MARC record in quickMARC (spitfire)', { tags: [testTypes.smoke, DevTeams.spitfire, features.quickMarcEditor] }, () => {
    InventoryInstance.goToEditMARCBiblRecord();
    QuickMarcEditor.waitLoading();

    const expectedInSourceRow = quickmarcEditor.addNewField(QuickMarcEditor.getFreeTags()[0]);
    quickmarcEditor.deletePenaltField().then(deletedTag => {
      const expectedInSourceRowWithSubfield = quickmarcEditor.addNewFieldWithSubField(QuickMarcEditor.getFreeTags()[1]);
      QuickMarcEditor.pressSaveAndClose();
      QuickMarcEditor.deleteConfirmationPresented();
      QuickMarcEditor.confirmDelete();
      InventoryInstance.viewSource();
      InventoryViewSource.contains(expectedInSourceRow);
      InventoryViewSource.contains(expectedInSourceRowWithSubfield);
      InventoryViewSource.notContains(deletedTag);
    });
  });

  it('C10924 Add a field to a record using quickMARC (spitfire)', { tags: [testTypes.smoke, DevTeams.spitfire, features.quickMarcEditor] }, () => {
    InventoryInstance.goToEditMARCBiblRecord();
    QuickMarcEditor.waitLoading();
    quickmarcEditor.addRow();
    quickmarcEditor.checkInitialContent();
    const expectedInSourceRow = quickmarcEditor.fillAllAvailableValues();

    QuickMarcEditor.pressSaveAndClose();
    InventoryInstance.waitLoading();
    InventoryInstance.viewSource();
    InventoryViewSource.contains(expectedInSourceRow);
    InventoryViewSource.close();
    InventoryInstance.waitLoading();

    InventoryInstance.goToEditMARCBiblRecord();
    QuickMarcEditor.waitLoading();
    quickmarcEditor.checkContent();
  });

  it('C10928 Delete a field(s) from a record in quickMARC (spitfire)', { tags: [testTypes.smoke, DevTeams.spitfire, features.quickMarcEditor] }, () => {
    InventoryInstance.goToEditMARCBiblRecord();
    QuickMarcEditor.waitLoading();
    quickmarcEditor.deletePenaltField().then(deletedTag => {
      QuickMarcEditor.pressSaveAndClose();
      QuickMarcEditor.deleteConfirmationPresented();
      QuickMarcEditor.confirmDelete();
      InventoryInstance.waitLoading();
      InventoryInstance.viewSource();
      InventoryViewSource.notContains(deletedTag);
    });
  });

  it('C10957 Attempt to delete a required field (spitfire)', { tags: [testTypes.smoke, DevTeams.spitfire, features.quickMarcEditor] }, () => {
    InventoryInstance.goToEditMARCBiblRecord();
    QuickMarcEditor.waitLoading();
    QuickMarcEditor.checkRequiredFields();
  });

  it('C10951 Add a 5XX field to a marc record in quickMARC (spitfire)', { tags: [testTypes.smoke, DevTeams.spitfire, features.quickMarcEditor] }, () => {
    InventoryInstance.startOverlaySourceBibRecord();
    InventoryActions.fillImportFields(InventoryInstance.validOCLC.id);
    InventoryActions.pressImportInModal();

    // TODO: add id to div with update datetime and verification of this value
    InventoryInstance.checkExpectedOCLCPresence();
    InventoryInstance.checkExpectedMARCSource();

    InventoryInstance.editInstance();
    InventoryInstanceEdit.checkReadOnlyFields();
    InventoryInstanceEdit.close();

    InventoryInstance.goToEditMARCBiblRecord();
    QuickMarcEditor.waitLoading();
    quickmarcEditor.addRow();
    quickmarcEditor.checkInitialContent();

    const testRecord = { content: 'testContent', tag: '505', tagMeaning: 'Formatted Contents Note' };
    const expectedInSourceRow = quickmarcEditor.fillAllAvailableValues(testRecord.content, testRecord.tag);
    QuickMarcEditor.pressSaveAndClose();

    InventoryInstance.viewSource();
    InventoryViewSource.contains(expectedInSourceRow);
    InventoryViewSource.close();

    InventoryInstance.checkInstanceNotes(testRecord.tagMeaning, testRecord.content);
  });

  it('C345388 Derive a MARC bib record (spitfire)', { tags: [testTypes.smoke, DevTeams.spitfire, features.quickMarcEditor] }, () => {
    // TODO: check the issue with reading in new version of interactors
    InventoryInstance.getAssignedHRID()
      .then(instanceHRID => {
        InventoryInstance.deriveNewMarcBib();
        const expectedCreatedValue = quickmarcEditor.addNewField();

        quickmarcEditor.deletePenaltField().then(deletedTag => {
          const expectedUpdatedValue = quickmarcEditor.updateExistingField();

          QuickMarcEditor.pressSaveAndClose();
          QuickMarcEditor.deleteConfirmationPresented();
          QuickMarcEditor.confirmDelete();

          InventoryInstance.checkUpdatedHRID(instanceHRID);
          InventoryInstance.checkExpectedMARCSource();
          // TODO: find correct tag to new field in record which presented into Inventory Instance
          InventoryInstance.checkPresentedText(expectedUpdatedValue);

          InventoryInstance.viewSource();
          InventoryViewSource.contains(expectedCreatedValue);
          InventoryViewSource.contains(expectedUpdatedValue);
          InventoryViewSource.notContains(deletedTag);
        });
      });
  });

  it('C353612 Verify "LDR" validation rules with invalid data for editable and non-editable positions when editing/deriving record (spitfire)', { tags: [testTypes.smoke, DevTeams.spitfire, features.quickMarcEditor] }, () => {
    const checkLdrErrors = () => {
      const initialLDRValue = InventoryInstance.validOCLC.ldrValue;
      const positions6Error = 'Record cannot be saved. Please enter a valid Leader 06. Valid values are listed at https://loc.gov/marc/bibliographic/bdleader.html';
      const position7Error = 'Record cannot be saved. Please enter a valid Leader 07. Valid values are listed at https://loc.gov/marc/bibliographic/bdleader.html';
      const positions6And7Error = 'Record cannot be saved. Please enter a valid Leader 06 and Leader 07. Valid values are listed at https://loc.gov/marc/bibliographic/bdleader.html';
      const readOnlyPositionsError = 'Record cannot be saved. Please check the Leader. Only positions 5, 6, 7, 8, 17, 18 and/or 19 can be edited in the Leader.';

      const changedLDRs = [
        { newContent: replaceByIndex(replaceByIndex(initialLDRValue, 6, 'h'), 7, 'm'), errorMessage: positions6Error, is008presented: false },
        { newContent: replaceByIndex(replaceByIndex(initialLDRValue, 6, 'p'), 7, 'g'), errorMessage: position7Error, is008presented: true },
        { newContent: replaceByIndex(replaceByIndex(initialLDRValue, 6, 'a'), 7, 'g'), errorMessage: position7Error, is008presented: false },
        { newContent: replaceByIndex(replaceByIndex(initialLDRValue, 6, '1'), 7, '$'), errorMessage: positions6And7Error, is008presented: false },
        { newContent: replaceByIndex(initialLDRValue, 1, 'z'), errorMessage: readOnlyPositionsError, is008presented: true },
        { newContent: replaceByIndex(initialLDRValue, 4, 'z'), errorMessage: readOnlyPositionsError, is008presented: true },
        { newContent: replaceByIndex(initialLDRValue, 9, 'z'), errorMessage: readOnlyPositionsError, is008presented: true },
        { newContent: replaceByIndex(initialLDRValue, 16, 'z'), errorMessage: readOnlyPositionsError, is008presented: true },
        { newContent: replaceByIndex(initialLDRValue, 20, 'z'), errorMessage: readOnlyPositionsError, is008presented: true },
        { newContent: replaceByIndex(initialLDRValue, 23, 'z'), errorMessage: readOnlyPositionsError, is008presented: true },
      ];

      changedLDRs.forEach(changedLDR => {
        quickmarcEditor.updateExistingField('LDR', changedLDR.newContent);
        cy.wrap(QuickMarcEditor.pressSaveAndClose()).then(() => {
          cy.expect(Callout(changedLDR.errorMessage).exists());
          cy.do(Callout(changedLDR.errorMessage).dismiss());
          cy.expect(Callout(changedLDR.errorMessage).absent());
          // eslint-disable-next-line no-unused-expressions
          changedLDR.is008presented ? quickmarcEditor.checkInitialInstance008Content() : QuickMarcEditor.checkEmptyContent('008');
        });
      });
    };


    InventoryInstance.checkExpectedMARCSource();
    InventoryInstance.goToEditMARCBiblRecord();
    QuickMarcEditor.waitLoading();
    checkLdrErrors();
    QuickMarcEditor.closeWithoutSaving();
    InventoryInstance.deriveNewMarcBib();
    QuickMarcEditor.check008FieldsAbsent('Type', 'Blvl');
    checkLdrErrors();
  });

  it('C353610 Verify "LDR" validation rules with valid data for positions 06 and 07 when editing record (spitfire)', { tags: [testTypes.smoke, DevTeams.spitfire, features.quickMarcEditor] }, () => {
    const initialLDRValue = '01677cam\\a22003974c\\4500';
    const changesIn06 = ['a', 'c', 'd', 'e', 'f', 'g', 'i', 'j', 'k', 'm', 'o', 'p', 'r', 't'];
    const changesIn07 = ['a', 'b', 'c', 'd', 'i', 'm', 's'];

    InventoryInstance.checkExpectedMARCSource();

    const checkCorrectUpdate = (subfieldIndex, values) => {
      values.forEach(specialValue => {
        InventoryInstance.goToEditMARCBiblRecord();
        QuickMarcEditor.waitLoading();
        quickmarcEditor.updateExistingField('LDR', replaceByIndex(initialLDRValue, subfieldIndex, specialValue));
        QuickMarcEditor.checkSubfieldsPresenceInTag008();
        QuickMarcEditor.pressSaveAndClose();
        InventoryInstance.waitLoading();
      });
    };

    checkCorrectUpdate(6, changesIn06);
    checkCorrectUpdate(7, changesIn07);
  });

  afterEach(() => {
    Users.deleteViaApi(userId);
  });
});