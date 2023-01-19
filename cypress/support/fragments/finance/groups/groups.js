import getRandomPostfix from '../../../utils/stringTools';
import { Button, Accordion, TextField, Section, KeyValue, Modal, MultiColumnList, MultiColumnListRow, MultiColumnListCell, Pane, Checkbox, MultiColumnListHeader, SelectionOption, Link } from '../../../../../interactors';

const newButton = Button('New');
const nameField = TextField('Name*');
const codeField = TextField('Code*');
const fundModal = Modal('Select funds');

export default {

  defaultUiGroup: {
    name: `autotest_group_${getRandomPostfix()}`,
    code: getRandomPostfix(),
    status: 'Active'
  },

  createViaApi: (groupProperties) => {
    return cy
      .okapiRequest({
        path: 'finance/groups',
        body: groupProperties,
        method: 'POST'
      })
      .then((response) => {
        return response.body;
      });
  },

  createDefaultGroup(defaultGroup) {
    cy.do([
      newButton.click(),
      nameField.fillIn(defaultGroup.name),
      codeField.fillIn(defaultGroup.code),
      Button('Save & Close').click()
    ]);
    this.waitForGroupDetailsLoading();
  },

  waitForGroupDetailsLoading : () => {
    cy.do(Section({ id: 'pane-group-details' }).visible);
  },

  deleteGroupViaActions: () => {
    cy.do([
      Button('Actions').click(),
      Button('Delete').click(),
      Button('Delete', { id:'clickable-group-remove-confirmation-confirm' }).click()
    ]);
  },

  addFundToGroup: (ledgerName) => {
    cy.do([
      Section({ id: 'fund' }).find(Button('Add to group')).click(),
      fundModal.find(Button({ id: 'accordion-toggle-button-ledgerId' })).click(),
      fundModal.find(Button({ id: 'ledgerId-selection' })).click(),
      SelectionOption(ledgerName).click(),
      MultiColumnList({ id: 'list-plugin-find-records' })
        .find(MultiColumnListHeader({ id:'list-column-ischecked' }))
        .find(Checkbox())
        .click(),
      fundModal.find(Button('Save')).click()
    ]);
  },

  checkAddingMultiplyFunds: (secondFundName, firstFundName) => {
    cy.expect([
      Accordion({ id: 'fund' })
        .find(MultiColumnListRow({ index: 0 }))
        .find(MultiColumnListCell({ columnIndex: 0 }))
        .has({ content: secondFundName }),
      Accordion({ id: 'fund' })
        .find(MultiColumnListRow({ index: 1 }))
        .find(MultiColumnListCell({ columnIndex: 0 }))
        .has({ content: firstFundName }),
    ]);
  },

  waitLoading : () => {
    cy.expect(Pane({ id: 'group-results-pane' }).exists());
  },

  tryToCreateGroupWithoutMandatoryFields(groupName) {
    cy.do([
      newButton.click(),
      nameField.fillIn(groupName),
      Button('Save & Close').click(),
    ]);
    cy.expect(codeField.has({ error: 'Required!' }));
    cy.do([
      // try to navigate without saving
      Button('Agreements').click(),
      Button('Keep editing').click,
      Button('Cancel').click(),
      Button('Close without saving').click()
    ]);
  },

  checkSearchResults: (groupName) => {
    cy.expect(MultiColumnList({ id: 'groups-list' })
      .find(MultiColumnListRow({ index: 0 }))
      .find(MultiColumnListCell({ columnIndex: 0 }))
      .has({ content: groupName }));
  },

  resetFilters: () => {
    cy.do(Button({ id: 'reset-groups-filters' }).click());
  },

  openAcquisitionAccordion() {
    cy.do(Button({ id: 'accordion-toggle-button-acqUnitIds' }).click());
  },

  selectNoAcquisitionUnit() {
    cy.do([
      Button({ id: 'acqUnitIds-selection' }).click(),
      SelectionOption('No acquisition unit').click(),
    ]);
  },

  selectActiveStatus() {
    cy.do([
      Button({ text: 'Status' }).click(),
      Checkbox({ name: 'Active' }).click(),
    ]);
  },

  checkCreatedGroup: (defaultGroup) => {
    cy.expect(Accordion({ id: 'information' }).find(KeyValue({ value: defaultGroup.name })).exists());
  },

  deleteGroupViaApi: (groupId) => cy.okapiRequest({
    method: 'DELETE',
    path: `finance/groups/${groupId}`,
    isDefaultSearchParamsRequired: false,
  }),

  selectGroup:(GroupName) => {
    cy.do(Section({ id: 'group-results-pane' }).find(Link(GroupName)).click());
  },

  checkCreatedInList: (GroupName) => {
    cy.expect(Section({ id: 'group-results-pane' }).find(Link(GroupName)).exists());
  },
};
