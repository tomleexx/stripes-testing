import getRandomPostfix from '../../../support/utils/stringTools';
import TestTypes from '../../../support/dictionary/testTypes';
import DevTeams from '../../../support/dictionary/devTeams';
import {
  LOAN_TYPE_NAMES,
  MATERIAL_TYPE_NAMES,
  ITEM_STATUS_NAMES
} from '../../../support/constants';
import DataImport from '../../../support/fragments/data_import/dataImport';
import JobProfiles from '../../../support/fragments/data_import/job_profiles/jobProfiles';
import Logs from '../../../support/fragments/data_import/logs/logs';
import InventorySearchAndFilter from '../../../support/fragments/inventory/inventorySearchAndFilter';
import ExportFile from '../../../support/fragments/data-export/exportFile';
import TopMenu from '../../../support/fragments/topMenu';
import MatchProfiles from '../../../support/fragments/data_import/match_profiles/matchProfiles';
import NewMatchProfile from '../../../support/fragments/data_import/match_profiles/newMatchProfile';
import NewFieldMappingProfile from '../../../support/fragments/data_import/mapping_profiles/newFieldMappingProfile';
import NewActionProfile from '../../../support/fragments/data_import/action_profiles/newActionProfile';
import FieldMappingProfiles from '../../../support/fragments/data_import/mapping_profiles/fieldMappingProfiles';
import ActionProfiles from '../../../support/fragments/data_import/action_profiles/actionProfiles';
import NewJobProfile from '../../../support/fragments/data_import/job_profiles/newJobProfile';
import FileManager from '../../../support/utils/fileManager';
import ExportFieldMappingProfiles from '../../../support/fragments/data-export/exportMappingProfile/exportFieldMappingProfiles';
import ExportJobProfiles from '../../../support/fragments/data-export/exportJobProfile/exportJobProfiles';
import SettingsMenu from '../../../support/fragments/settingsMenu';
import FileDetails from '../../../support/fragments/data_import/logs/fileDetails';
import SettingsJobProfiles from '../../../support/fragments/settings/dataImport/settingsJobProfiles';
import InventoryInstance from '../../../support/fragments/inventory/inventoryInstance';

describe('ui-data-import', () => {
  let instanceHRID = null;
  // profile names for creating
  const nameMarcBibMappingProfile = `autotest_marcBib_mapping_profile_${getRandomPostfix()}`;
  const nameInstanceMappingProfile = `autotest_instance_mapping_profile_${getRandomPostfix()}`;
  const nameHoldingsMappingProfile = `autotest_holdings_mapping_profile_${getRandomPostfix()}`;
  const nameItemMappingProfile = `autotest_item_mapping_profile_${getRandomPostfix()}`;
  const nameMarcBibActionProfile = `autotest_marcBib_action_profile_${getRandomPostfix()}`;
  const nameInstanceActionProfile = `autotest_instance_action_profile_${getRandomPostfix()}`;
  const nameHoldingsActionProfile = `autotest_holdings_action_profile_${getRandomPostfix()}`;
  const nameItemActionProfile = `autotest_item_action_profile_${getRandomPostfix()}`;
  const jobProfileNameCreate = `autotest_job_profile_${getRandomPostfix()}`;
  const recordType = 'MARC_BIBLIOGRAPHIC';
  // file names
  const nameMarcFileForImportCreate = `C343335autotestFile.${getRandomPostfix()}.mrc`;
  const nameForCSVFile = `autotestFile${getRandomPostfix()}.csv`;
  const nameMarcFileForImportUpdate = `C343335autotestFile${getRandomPostfix()}.mrc`;
  const jobProfileNameForExport = `autoTestJobProf.${getRandomPostfix()}`;

  const marcBibMappingProfile = {
    profile:{
      id: '',
      name: nameMarcBibMappingProfile,
      incomingRecordType: recordType,
      existingRecordType: recordType,
      mappingDetails: { name: 'holdings',
        recordType: 'MARC_BIBLIOGRAPHIC',
        marcMappingDetails: [{
          order: 0,
          action: 'ADD',
          field: {
            field: '650',
            indicator2: '4',
            subfields: [{
              subfield: 'a',
              data: {
                text: 'Test update'
              }
            }]
          }
        }],
        marcMappingOption: 'MODIFY' }
    }
  };

  const instanceMappingProfile = {
    profile:{
      id: '',
      name: nameInstanceMappingProfile,
      incomingRecordType: recordType,
      existingRecordType: 'INSTANCE',
    }
  };

  const holdingsMappingProfile = {
    profile:{
      id: '',
      name: nameHoldingsMappingProfile,
      incomingRecordType: recordType,
      existingRecordType: 'HOLDINGS',
      mappingDetails: { name: 'holdings',
        recordType: 'HOLDINGS',
        mappingFields: [
          { name: 'permanentLocationId',
            enabled: true,
            path: 'holdings.permanentLocationId',
            value: '"Annex (KU/CC/DI/A)"' }] }
    }
  };

  const itemMappingProfile = {
    profile:{
      id: '',
      name: nameItemMappingProfile,
      incomingRecordType: recordType,
      existingRecordType: 'ITEM',
      mappingDetails: { name: 'item',
        recordType: 'ITEM',
        mappingFields: [
          { name: 'materialType.id',
            enabled: true,
            path: 'item.materialType.id',
            value: '"book"',
            acceptedValues: { '1a54b431-2e4f-452d-9cae-9cee66c9a892': 'book' } },
          { name: 'permanentLoanType.id',
            enabled: true,
            path: 'item.permanentLoanType.id',
            value: '"Can circulate"',
            acceptedValues: { '2b94c631-fca9-4892-a730-03ee529ffe27': 'Can circulate' } },
          { name: 'status.name',
            enabled: true,
            path: 'item.status.name',
            value: '"In process"' }] }
    }
  };

  const marcBibActionProfile = {
    profile: {
      id: '',
      name: nameMarcBibActionProfile,
      action: 'MODIFY',
      folioRecord: recordType
    },
    addedRelations: [
      {
        masterProfileType: 'ACTION_PROFILE',
        detailProfileId: '',
        detailProfileType: 'MAPPING_PROFILE'
      }
    ],
    deletedRelations: []
  };

  const instanceActionProfile = {
    profile: {
      id: '',
      name: nameInstanceActionProfile,
      action: 'CREATE',
      folioRecord: 'INSTANCE'
    },
    addedRelations: [
      {
        masterProfileId: null,
        masterProfileType: 'ACTION_PROFILE',
        detailProfileId: '',
        detailProfileType: 'MAPPING_PROFILE'
      }
    ],
    deletedRelations: []
  };

  const holdingsActionProfile = {
    profile: {
      id: '',
      name: nameHoldingsActionProfile,
      action: 'CREATE',
      folioRecord: 'HOLDINGS'
    },
    addedRelations: [
      {
        masterProfileId: null,
        masterProfileType: 'ACTION_PROFILE',
        detailProfileId: '',
        detailProfileType: 'MAPPING_PROFILE'
      }
    ],
    deletedRelations: []
  };

  const itemActionProfile = {
    profile: {
      id: '',
      name: nameItemActionProfile,
      action: 'CREATE',
      folioRecord: 'ITEM'
    },
    addedRelations: [
      {
        masterProfileId: null,
        masterProfileType: 'ACTION_PROFILE',
        detailProfileId: '',
        detailProfileType: 'MAPPING_PROFILE'
      }
    ],
    deletedRelations: []
  };

  // TODO redesine classes inherites
  const testData = [
    { mappingProfile: marcBibMappingProfile,
      actionProfile: marcBibActionProfile },
    { mappingProfile: instanceMappingProfile,
      actionProfile: instanceActionProfile },
    { mappingProfile: holdingsMappingProfile,
      actionProfile: holdingsActionProfile },
    { mappingProfile: itemMappingProfile,
      actionProfile: itemActionProfile },
  ];

  const collectionOfMappingAndActionProfiles = [
    {
      mappingProfile: { typeValue: NewFieldMappingProfile.folioRecordTypeValue.instance,
        name: `autotestMappingInstance${getRandomPostfix()}` },
      actionProfile: { typeValue: NewActionProfile.folioRecordTypeValue.instance,
        name: `autotestActionInstance${getRandomPostfix()}`,
        action: 'Update (all record types except Orders, Invoices, or MARC Holdings)' }
    },
    {
      mappingProfile: { typeValue: NewFieldMappingProfile.folioRecordTypeValue.holdings,
        name: `autotestMappingHoldings${getRandomPostfix()}` },
      actionProfile: { typeValue: NewActionProfile.folioRecordTypeValue.holdings,
        name: `autotestActionHoldings${getRandomPostfix()}`,
        action: 'Update (all record types except Orders, Invoices, or MARC Holdings)' }
    },
    {
      mappingProfile: { typeValue : NewFieldMappingProfile.folioRecordTypeValue.item,
        name: `autotestMappingItem${getRandomPostfix()}` },
      actionProfile: { typeValue: NewActionProfile.folioRecordTypeValue.item,
        name: `autotestActionItem${getRandomPostfix()}`,
        action: 'Update (all record types except Orders, Invoices, or MARC Holdings)' }
    }
  ];

  const collectionOfMatchProfiles = [
    {
      matchProfile: { profileName: `autotestMatchInstance${getRandomPostfix()}`,
        incomingRecordFields: {
          field: '001'
        },
        existingRecordFields: {
          field: '001'
        },
        matchCriterion: 'Exactly matches',
        existingRecordType: 'MARC_BIBLIOGRAPHIC' }
    },
    {
      matchProfile: { profileName: `autotestMatchHoldings${getRandomPostfix()}`,
        incomingRecordFields: {
          field: '901',
          subfield: 'a'
        },
        matchCriterion: 'Exactly matches',
        existingRecordType: 'HOLDINGS',
        holdingsOption: NewMatchProfile.optionsList.holdingsHrid }
    },
    {
      matchProfile: {
        profileName: `autotestMatchItem${getRandomPostfix()}`,
        incomingRecordFields: {
          field: '902',
          subfield: 'a'
        },
        matchCriterion: 'Exactly matches',
        existingRecordType: 'ITEM',
        itemOption: NewMatchProfile.optionsList.itemHrid
      }
    }
  ];
  const jobProfileForUpdate = {
    ...NewJobProfile.defaultJobProfile,
    profileName: `autotestJobProf${getRandomPostfix()}`,
    acceptedType: NewJobProfile.acceptedDataType.marc
  };
  // create Field mapping profile for export
  const exportMappingProfile = {
    name: `autoTestMappingProf.${getRandomPostfix()}`,
    holdingsMarcField: '901',
    subfieldForHoldings:'$a',
    itemMarcField:'902',
    subfieldForItem:'$a'
  };

  beforeEach('create test data', () => {
    cy.loginAsAdmin({ path: TopMenu.dataImportPath, waiter: DataImport.waitLoading });
    cy.getAdminToken();

    const jobProfile = {
      profile: {
        name: jobProfileNameCreate,
        dataType: 'MARC'
      },
      addedRelations: [],
      deletedRelations: []
    };

    testData.jobProfileForCreate = jobProfile;

    testData.forEach(specialPair => {
      cy.createOnePairMappingAndActionProfiles(specialPair.mappingProfile, specialPair.actionProfile).then(idActionProfile => {
        cy.addJobProfileRelation(testData.jobProfileForCreate.addedRelations, idActionProfile);
      });
    });
    SettingsJobProfiles.createJobProfileApi(testData.jobProfileForCreate)
      .then((bodyWithjobProfile) => {
        testData.jobProfileForCreate.id = bodyWithjobProfile.body.id;
      });
  });

  afterEach(() => {
    // delete generated profiles
    JobProfiles.deleteJobProfile(jobProfileForUpdate.profileName);
    collectionOfMatchProfiles.forEach(profile => {
      MatchProfiles.deleteMatchProfile(profile.matchProfile.profileName);
    });
    collectionOfMappingAndActionProfiles.forEach(profile => {
      ActionProfiles.deleteActionProfile(profile.actionProfile.name);
      FieldMappingProfiles.deleteFieldMappingProfile(profile.mappingProfile.name);
    });
    JobProfiles.deleteJobProfile(jobProfileNameCreate);
    ActionProfiles.deleteActionProfile(nameMarcBibActionProfile);
    ActionProfiles.deleteActionProfile(nameInstanceActionProfile);
    ActionProfiles.deleteActionProfile(nameHoldingsActionProfile);
    ActionProfiles.deleteActionProfile(nameItemActionProfile);
    FieldMappingProfiles.deleteFieldMappingProfile(nameMarcBibMappingProfile);
    FieldMappingProfiles.deleteFieldMappingProfile(nameInstanceMappingProfile);
    FieldMappingProfiles.deleteFieldMappingProfile(nameHoldingsMappingProfile);
    FieldMappingProfiles.deleteFieldMappingProfile(nameItemMappingProfile);
    // delete downloads folder and created files in fixtures
    FileManager.deleteFolder(Cypress.config('downloadsFolder'));
    FileManager.deleteFile(`cypress/fixtures/${nameMarcFileForImportUpdate}`);
    FileManager.deleteFile(`cypress/fixtures/${nameForCSVFile}`);
    cy.getInstance({ limit: 1, expandAll: true, query: `"hrid"=="${instanceHRID}"` })
      .then((instance) => {
        cy.deleteItemViaApi(instance.items[0].id);
        cy.deleteHoldingRecordViaApi(instance.holdings[0].id);
        InventoryInstance.deleteInstanceViaApi(instance.id);
      });
  });

  const createInstanceMappingProfile = (profile) => {
    FieldMappingProfiles.openNewMappingProfileForm();
    NewFieldMappingProfile.fillSummaryInMappingProfile(profile);
    NewFieldMappingProfile.fillCatalogedDate('###TODAY###');
    NewFieldMappingProfile.fillInstanceStatusTerm();
    FieldMappingProfiles.saveProfile();
    FieldMappingProfiles.closeViewModeForMappingProfile(profile.name);
  };

  const createHoldingsMappingProfile = (profile) => {
    FieldMappingProfiles.openNewMappingProfileForm();
    NewFieldMappingProfile.fillSummaryInMappingProfile(profile);
    NewFieldMappingProfile.fillHoldingsType('Electronic');
    NewFieldMappingProfile.fillPermanentLocation('"Online (E)"');
    NewFieldMappingProfile.fillCallNumberType('Library of Congress classification');
    NewFieldMappingProfile.fillCallNumber('050$a " " 050$b');
    NewFieldMappingProfile.addElectronicAccess('Resource', '856$u');
    FieldMappingProfiles.saveProfile();
    FieldMappingProfiles.closeViewModeForMappingProfile(profile.name);
  };

  const createItemMappingProfile = (profile) => {
    FieldMappingProfiles.openNewMappingProfileForm();
    NewFieldMappingProfile.fillSummaryInMappingProfile(profile);
    NewFieldMappingProfile.fillMaterialType(MATERIAL_TYPE_NAMES.ELECTRONIC_RESOURCE);
    NewFieldMappingProfile.addItemNotes('"Electronic bookplate"', '"Smith Family Foundation"', 'Mark for all affected records');
    NewFieldMappingProfile.fillPermanentLoanType(LOAN_TYPE_NAMES.CAN_CIRCULATE);
    NewFieldMappingProfile.fillStatus(ITEM_STATUS_NAMES.AVAILABLE);
    FieldMappingProfiles.saveProfile();
    FieldMappingProfiles.closeViewModeForMappingProfile(profile.name);
  };

  it('C343335 MARC file upload with the update of instance, holding, and items (folijet)', { tags: [TestTypes.smoke, DevTeams.folijet] }, () => {
    // TODO delete reload after fix https://issues.folio.org/browse/MODDATAIMP-691
    cy.reload();
    // upload a marc file for creating of the new instance, holding and item
    DataImport.uploadFile('oneMarcBib.mrc', nameMarcFileForImportCreate);
    JobProfiles.searchJobProfileForImport(testData.jobProfileForCreate.profile.name);
    JobProfiles.runImportFile();
    JobProfiles.waitFileIsImported(nameMarcFileForImportCreate);
    Logs.openFileDetails(nameMarcFileForImportCreate);
    [FileDetails.columnName.srsMarc,
      FileDetails.columnName.instance,
      FileDetails.columnName.holdings,
      FileDetails.columnName.item].forEach(columnName => {
      FileDetails.checkStatusInColumn(FileDetails.status.created, columnName);
    });
    FileDetails.checkItemsQuantityInSummaryTable(0, '1');
    FileDetails.checkItemsQuantityInSummaryTable(1, '0');

    // get Instance HRID through API
    InventorySearchAndFilter.getInstanceHRID()
      .then(hrId => {
        instanceHRID = hrId[0];
        // download .csv file
        cy.visit(TopMenu.inventoryPath);
        InventorySearchAndFilter.searchInstanceByHRID(hrId[0]);
        InventorySearchAndFilter.saveUUIDs();
        ExportFile.downloadCSVFile(nameForCSVFile, 'SearchInstanceUUIDs*');
        FileManager.deleteFolder(Cypress.config('downloadsFolder'));
      });

    cy.visit(SettingsMenu.exportMappingProfilePath);
    ExportFieldMappingProfiles.createMappingProfile(exportMappingProfile);

    cy.visit(SettingsMenu.exportJobProfilePath);
    ExportJobProfiles.createJobProfile(jobProfileNameForExport, exportMappingProfile.name);

    // download exported marc file
    cy.visit(TopMenu.dataExportPath);
    ExportFile.uploadFile(nameForCSVFile);
    ExportFile.exportWithCreatedJobProfile(nameForCSVFile, jobProfileNameForExport);
    ExportFile.downloadExportedMarcFile(nameMarcFileForImportUpdate);

    // create mapping and action profiles
    cy.visit(SettingsMenu.mappingProfilePath);
    createInstanceMappingProfile(collectionOfMappingAndActionProfiles[0].mappingProfile);
    FieldMappingProfiles.checkMappingProfilePresented(collectionOfMappingAndActionProfiles[0].mappingProfile.name);
    createHoldingsMappingProfile(collectionOfMappingAndActionProfiles[1].mappingProfile);
    FieldMappingProfiles.checkMappingProfilePresented(collectionOfMappingAndActionProfiles[1].mappingProfile.name);
    createItemMappingProfile(collectionOfMappingAndActionProfiles[2].mappingProfile);
    FieldMappingProfiles.checkMappingProfilePresented(collectionOfMappingAndActionProfiles[2].mappingProfile.name);

    collectionOfMappingAndActionProfiles.forEach(profile => {
      cy.visit(SettingsMenu.actionProfilePath);
      ActionProfiles.create(profile.actionProfile, profile.mappingProfile.name);
      ActionProfiles.checkActionProfilePresented(profile.actionProfile.name);
    });

    // create Match profile
    cy.visit(SettingsMenu.matchProfilePath);
    collectionOfMatchProfiles.forEach(profile => {
      MatchProfiles.createMatchProfile(profile.matchProfile);
      MatchProfiles.checkMatchProfilePresented(profile.matchProfile.profileName);
    });

    // create Job profile
    cy.visit(SettingsMenu.jobProfilePath);
    JobProfiles.createJobProfileWithLinkingProfilesForUpdate(jobProfileForUpdate);
    NewJobProfile.linkMatchAndActionProfilesForInstance(collectionOfMappingAndActionProfiles[0].actionProfile.name, collectionOfMatchProfiles[0].matchProfile.profileName, 0);
    NewJobProfile.linkMatchAndActionProfilesForHoldings(collectionOfMappingAndActionProfiles[1].actionProfile.name, collectionOfMatchProfiles[1].matchProfile.profileName, 2);
    NewJobProfile.linkMatchAndActionProfilesForItem(collectionOfMappingAndActionProfiles[2].actionProfile.name, collectionOfMatchProfiles[2].matchProfile.profileName, 4);
    NewJobProfile.saveAndClose();

    // upload the exported marc file
    cy.visit(TopMenu.dataImportPath);
    // TODO delete reload after fix https://issues.folio.org/browse/MODDATAIMP-691
    cy.reload();
    DataImport.uploadExportedFile(nameMarcFileForImportUpdate);
    JobProfiles.searchJobProfileForImport(jobProfileForUpdate.profileName);
    JobProfiles.runImportFile();
    JobProfiles.waitFileIsImported(nameMarcFileForImportUpdate);
    Logs.openFileDetails(nameMarcFileForImportUpdate);
    [FileDetails.columnName.srsMarc,
      FileDetails.columnName.instance,
      FileDetails.columnName.holdings,
      FileDetails.columnName.item].forEach(columnName => {
      FileDetails.checkStatusInColumn(FileDetails.status.updated, columnName);
    });
    FileDetails.checkItemsQuantityInSummaryTable(1, '1');
  });
});
