import getRandomPostfix from '../../../support/utils/stringTools';
import permissions from '../../../support/dictionary/permissions';
import DevTeams from '../../../support/dictionary/devTeams';
import TestTypes from '../../../support/dictionary/testTypes';
import FieldMappingProfiles from '../../../support/fragments/data_import/mapping_profiles/fieldMappingProfiles';
import SettingsMenu from '../../../support/fragments/settingsMenu';
import {
  FOLIO_RECORD_TYPE,
  LOCATION_NAMES,
  LOAN_TYPE_NAMES,
  ITEM_STATUS_NAMES,
  ACCEPTED_DATA_TYPE_NAMES,
  JOB_STATUS_NAMES
} from '../../../support/constants';
import NewJobProfile from '../../../support/fragments/data_import/job_profiles/newJobProfile';
import NewFieldMappingProfile from '../../../support/fragments/data_import/mapping_profiles/newFieldMappingProfile';
import ActionProfiles from '../../../support/fragments/data_import/action_profiles/actionProfiles';
import JobProfiles from '../../../support/fragments/data_import/job_profiles/jobProfiles';
import DataImport from '../../../support/fragments/data_import/dataImport';
import TopMenu from '../../../support/fragments/topMenu';
import Logs from '../../../support/fragments/data_import/logs/logs';
import FileDetails from '../../../support/fragments/data_import/logs/fileDetails';
import Users from '../../../support/fragments/users/users';
import InstanceRecordView from '../../../support/fragments/inventory/instanceRecordView';
import InventoryInstance from '../../../support/fragments/inventory/inventoryInstance';

describe('data-import', () => {
  describe('Log details', () => {
    let user;
    let instanceHRID;
    const quantityOfCreatedHoldings = 5;
    const quantityOfCreatedItems = 8;
    const quantityOfErrors = 5;
    const arrayOfHoldingsStatuses = ['Created (KU/CC/DI/M)', 'Created (KU/CC/DI/A)', 'Created (E)', 'No action', 'No action'];
    const holdingsData = { permanentLocation: LOCATION_NAMES.MAIN_LIBRARY_UI,
      itemsQuqntity: 3 };
    const filePathForUpload = 'marcBibFileForC388506.mrc';
    const marcFileName = `C388506 autotestFileName.${getRandomPostfix()}`;
    const collectionOfMappingAndActionProfiles = [
      {
        mappingProfile: { typeValue: FOLIO_RECORD_TYPE.HOLDINGS,
          name: `C388506 Test multiple holdings.${getRandomPostfix()}`,
          permanentLocation: '945$h' },
        actionProfile: { typeValue: FOLIO_RECORD_TYPE.HOLDINGS,
          name: `C388506 Test multiple holdings.${getRandomPostfix()}` }
      },
      {
        mappingProfile: { typeValue: FOLIO_RECORD_TYPE.ITEM,
          name: `C388506 Test multiple items.${getRandomPostfix()}`,
          materialType: '945$a',
          permanentLoanType: LOAN_TYPE_NAMES.CAN_CIRCULATE,
          status: ITEM_STATUS_NAMES.AVAILABLE },
        actionProfile: { typeValue: FOLIO_RECORD_TYPE.ITEM,
          name: `C388506 Test multiple items.${getRandomPostfix()}` }
      }
    ];
    const jobProfile = { ...NewJobProfile.defaultJobProfile,
      profileName: `C388506 Test multiple items.${getRandomPostfix()}`,
      acceptedType: ACCEPTED_DATA_TYPE_NAMES.MARC };

    before('login', () => {
      cy.createTempUser([
        permissions.settingsDataImportEnabled.gui,
        permissions.moduleDataImportEnabled.gui,
        permissions.inventoryAll.gui
      ])
        .then(userProperties => {
          user = userProperties;

          cy.login(userProperties.username, userProperties.password,
            { path: SettingsMenu.mappingProfilePath, waiter: FieldMappingProfiles.waitLoading });
        });
    });

    after('delete test data', () => {
      Users.deleteViaApi(user.userId);
      JobProfiles.deleteJobProfile(jobProfile.profileName);
      collectionOfMappingAndActionProfiles.forEach(profile => {
        ActionProfiles.deleteActionProfile(profile.actionProfile.name);
        FieldMappingProfiles.deleteFieldMappingProfile(profile.mappingProfile.name);
      });
      cy.getInstance({ limit: 1, expandAll: true, query: `"hrid"=="${instanceHRID}"` })
        .then((instance) => {
          instance.items.forEach(item => cy.deleteItemViaApi(item.id));
          instance.holdings.forEach(holding => cy.deleteHoldingRecordViaApi(holding.id));
          InventoryInstance.deleteInstanceViaApi(instance.id);
        });
    });

    it('C388506 Check the log result table for imported multiple items with errors in multiple holdings (folijet)',
      { tags: [TestTypes.criticalPath, DevTeams.folijet] }, () => {
        // create mapping profiles
        FieldMappingProfiles.openNewMappingProfileForm();
        NewFieldMappingProfile.fillSummaryInMappingProfile(collectionOfMappingAndActionProfiles[0].mappingProfile);
        NewFieldMappingProfile.fillPermanentLocation(collectionOfMappingAndActionProfiles[0].mappingProfile.permanentLocation);
        FieldMappingProfiles.saveProfile();
        FieldMappingProfiles.closeViewModeForMappingProfile(collectionOfMappingAndActionProfiles[0].mappingProfile.name);

        FieldMappingProfiles.openNewMappingProfileForm();
        NewFieldMappingProfile.fillSummaryInMappingProfile(collectionOfMappingAndActionProfiles[1].mappingProfile);
        NewFieldMappingProfile.fillMaterialType(collectionOfMappingAndActionProfiles[1].mappingProfile.materialType);
        NewFieldMappingProfile.fillPermanentLoanType(collectionOfMappingAndActionProfiles[1].mappingProfile.permanentLoanType);
        NewFieldMappingProfile.fillStatus(collectionOfMappingAndActionProfiles[1].mappingProfile.status);
        FieldMappingProfiles.saveProfile();
        FieldMappingProfiles.closeViewModeForMappingProfile(collectionOfMappingAndActionProfiles[1].mappingProfile.name);

        // create action profiles
        collectionOfMappingAndActionProfiles.forEach(profile => {
          cy.visit(SettingsMenu.actionProfilePath);
          ActionProfiles.create(profile.actionProfile, profile.mappingProfile.name);
          ActionProfiles.checkActionProfilePresented(profile.actionProfile.name);
        });

        // create job profile
        cy.visit(SettingsMenu.jobProfilePath);
        JobProfiles.createJobProfile(jobProfile);
        NewJobProfile.linkActionProfileByName('Default - Create instance');
        NewJobProfile.linkActionProfile(collectionOfMappingAndActionProfiles[0].actionProfile);
        NewJobProfile.linkActionProfile(collectionOfMappingAndActionProfiles[1].actionProfile);
        NewJobProfile.saveAndClose();
        JobProfiles.checkJobProfilePresented(jobProfile.profileName);

        // upload .mrc file
        cy.visit(TopMenu.dataImportPath);
        // TODO delete function after fix https://issues.folio.org/browse/MODDATAIMP-691
        DataImport.verifyUploadState();
        DataImport.uploadFile(filePathForUpload, marcFileName);
        JobProfiles.searchJobProfileForImport(jobProfile.profileName);
        JobProfiles.runImportFile();
        JobProfiles.waitFileIsImported(marcFileName);
        Logs.checkStatusOfJobProfile(JOB_STATUS_NAMES.COMPLETED_WITH_ERRORS);
        Logs.openFileDetails(marcFileName);
        [FileDetails.columnNameInResultList.srsMarc,
          FileDetails.columnNameInResultList.instance].forEach(columnName => {
          FileDetails.checkStatusInColumn(FileDetails.status.created, columnName);
        });
        FileDetails.verifyMultipleHoldingsStatus(arrayOfHoldingsStatuses, quantityOfCreatedHoldings);
        FileDetails.verifyMultipleItemsStatus(quantityOfCreatedItems);
        FileDetails.verifyMultipleErrorStatus(quantityOfErrors);

        FileDetails.openInstanceInInventory('Created');
        InventoryInstance.getAssignedHRID().then(initialInstanceHrId => {
          instanceHRID = initialInstanceHrId;
        });
        InventoryInstance.checkIsHoldingsCreated([`${holdingsData.permanentLocation} >`]);
        InventoryInstance.openHoldingsAccordion(`${holdingsData.permanentLocation} >`);
        InstanceRecordView.verifyQuantityOfItemsRelatedtoHoldings(holdingsData.permanentLocation, holdingsData.itemsQuqntity);
      });
  });
});