import uuid from 'uuid';
import TenantPane, { getDefaultTenant } from '../baseTenantPane';

const selectInstitution = () => TenantPane.selectOption('Institution', 'KU');

export default {
  ...TenantPane,
  waitLoading() {
    TenantPane.waitLoading('Campuses');
  },
  viewTable() {
    selectInstitution();
  },
  getDefaultCampuse() {
    return getDefaultTenant({ institutionId: '' });
  },
  defaultUiCampuses: {
    body: getDefaultTenant({ institutionId: uuid() }),
  },
  checkResultsTableContent(records) {
    TenantPane.checkResultsTableColumns([
      'Campus',
      'Code',
      'Last updated',
      '# of Libraries',
      'Actions',
    ]);
    TenantPane.checkResultsTableContent(records);
  },
  checkEmptyTableContent() {
    const messages = ['Please select an institution to continue.', 'There are no Campuses'];
    TenantPane.checkEmptyTableContent(messages);
  },
  getViaApi() {
    return TenantPane.getViaApi({ path: 'location-units/campuses' });
  },
  createViaApi(campusesProperties = getDefaultTenant({ institutionId: uuid() })) {
    return TenantPane.createViaApi({ path: 'location-units/campuses', body: campusesProperties });
  },
  deleteViaApi(campusId) {
    return TenantPane.deleteViaApi({ path: `location-units/campuses/${campusId}` });
  },
};
