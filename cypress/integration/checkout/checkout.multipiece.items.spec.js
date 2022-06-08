import TestTypes from '../../support/dictionary/testTypes';
import permissions from '../../support/dictionary/permissions';
import TopMenu from '../../support/fragments/topMenu';
import getRandomPostfix from '../../support/utils/stringTools';
import Helper from '../../support/fragments/finance/financeHelper';
import CheckOutActions from '../../support/fragments/check-out-actions/check-out-actions';
import NewServicePoint from '../../support/fragments/service_point/newServicePoint';
import ServicePoints from '../../support/fragments/settings/tenant/servicePoints';
import MultipieceCheckOut from '../../support/fragments/checkout/modals/multipieceCheckOut';
import UsersEditPage from '../../support/fragments/users/usersEditPage';
import Checkout from '../../support/fragments/checkout/checkout';
import InventoryInstances from '../../support/fragments/inventory/inventoryInstances';
import CheckInActions from '../../support/fragments/check-in-actions/checkInActions';
import Users from '../../support/fragments/users/users';

describe('Check Out', () => {
  let user = {};
  let userBarcode;
  let servicePoint;
  let materialTypeName;
  let testInstanceIds;
  const instanceTitle = `autotest_instance_title_${getRandomPostfix()}`;
  const testItems = [];
  const defautlDescription = `autotest_description_${getRandomPostfix()}`;

  beforeEach(() => {
    cy.getAdminToken().then(() => {
      cy.getLoanTypes({ limit: 1 });
      cy.getMaterialTypes({ limit: 1 })
        .then(({ id, name }) => {
          materialTypeName = { id, name };
        });
      cy.getLocations({ limit: 2 });
      cy.getHoldingTypes({ limit: 2 });
      cy.getInstanceTypes({ limit: 1 });
    }).then(() => {
      const getTestItem = (numberOfPieces, hasDiscription, hasMissingPieces) => {
        const defaultItem = {
          barcode: Helper.getRandomBarcode(),
          status:  { name: 'Available' },
          permanentLoanType: { id: Cypress.env('loanTypes')[0].id },
          materialType: { id: materialTypeName.id },
        };
        if (numberOfPieces) {
          defaultItem.numberOfPieces = numberOfPieces;
        }
        if (hasDiscription) {
          defaultItem.descriptionOfPieces = defautlDescription;
        }
        if (hasMissingPieces) {
          defaultItem.numberOfMissingPieces = 2;
          defaultItem.missingPieces = defautlDescription;
        }
        return defaultItem;
      };
      testItems.push(getTestItem(1, false, false));
      testItems.push(getTestItem(3, true, false));
      testItems.push(getTestItem(2, true, true));
      testItems.push(getTestItem(1, false, true));
      InventoryInstances.createFolioInstanceViaApi({
        instance: {
          instanceTypeId: Cypress.env('instanceTypes')[0].id,
          title: instanceTitle,
        },
        holdings: [{
          holdingsTypeId: Cypress.env('holdingsTypes')[0].id,
          permanentLocationId: Cypress.env('locations')[0].id,
        }],
        items: testItems,
      })
        .then(specialInstanceIds => {
          testInstanceIds = specialInstanceIds;
        });
    });

    cy.createTempUser([
      permissions.checkoutCirculatingItems.gui,
    ])
      .then(userProperties => {
        user = userProperties;
        servicePoint = NewServicePoint.getDefaulServicePoint();
        ServicePoints.createViaApi(servicePoint.body);
        UsersEditPage.addServicePointsToUser([servicePoint.body.id],
          user.userId, servicePoint.body.id);
      })
      .then(() => {
        cy.getUsers({ limit: 1, query: `"personal.lastName"="${user.username}" and "active"="true"` })
          .then((users) => {
            userBarcode = users[0].barcode;
          });
        cy.login(user.username, user.password, { path: TopMenu.checkOutPath, waiter: Checkout.waitLoading });
      });
  });

  after(() => {
    testItems.forEach(item => {
      CheckInActions.createItemCheckinApi({
        itemBarcode: item.barcode,
        servicePointId: servicePoint.body.id,
        checkInDate: '2021-09-30T16:14:50.444Z',
      });
    });
    cy.wrap(testInstanceIds.holdingIds.forEach(holdingsId => {
      cy.wrap(holdingsId.itemIds.forEach(itemId => {
        cy.deleteItem(itemId);
      })).then(() => {
        cy.deleteHoldingRecord(holdingsId.id);
      });
    })).then(() => {
      cy.deleteInstanceApi(testInstanceIds.instanceId);
    });
    cy.wrap(UsersEditPage.changeServicePointPreferenceViaApi(user.userId, [servicePoint.body.id]))
      .then(() => {
        cy.deleteServicePoint(servicePoint.body.id);
        Users.deleteViaApi(user.userId);
      });
  });

  const fullCheckOut = ({ barcode, numberOfPieces, descriptionOfPieces, numberOfMissingPieces, missingPieces }) => {
    CheckOutActions.checkOutItem(userBarcode, barcode);
    MultipieceCheckOut.checkContent(instanceTitle, materialTypeName.name, barcode,
      { itemPieces : numberOfPieces, description : descriptionOfPieces },
      { missingitemPieces : numberOfMissingPieces, missingDescription: missingPieces });
  };

  it('C591 Check out: multipiece items', { tags: [TestTypes.smoke] }, () => {
    CheckOutActions.checkIsInterfacesOpened();
    CheckOutActions.checkOutItem(userBarcode, testItems[0].barcode);
    CheckOutActions.checkPatronInformation(user.username, userBarcode);
    cy.expect(CheckOutActions.modal.absent());

    fullCheckOut(testItems[1]);
    MultipieceCheckOut.cancelModal();
    CheckOutActions.checkItemstatus(testItems[1].barcode);

    fullCheckOut(testItems[1]);
    MultipieceCheckOut.confirmMultipleCheckOut(testItems[1].barcode);

    fullCheckOut(testItems[2]);
    MultipieceCheckOut.confirmMultipleCheckOut(testItems[2].barcode);

    fullCheckOut(testItems[3]);
    MultipieceCheckOut.confirmMultipleCheckOut(testItems[3].barcode);
  });
});