// Bulk export reports as PDF or Excel bundle
export const bulkExportReports = async ({ reportIds, format }) => {
  const response = await api.post('/reports/bulk-export', { reportIds, format }, {
    responseType: format === 'excel' ? 'blob' : 'arraybuffer',
  });
  return response;
};
import api from './api';

export const fetchReports = async (params = {}) => {
  const response = await api.get('/reports', { params });
  // Return both reports and pagination if available
  if (response.data?.data?.reports) {
    return {
      reports: response.data.data.reports,
      pagination: response.data.data.pagination || {},
    };
  }
  return { reports: [], pagination: {} };
};

export const fetchReportById = async (id) => {
  const response = await api.get(`/reports/${id}`);
  return response.data?.data?.report || null;
};

// Update a report
export const updateReport = async (id, data) => {
  const response = await api.put(`/reports/${id}`, data);
  return response.data?.data?.report || null;
};

// Duplicate a report
export const duplicateReport = async (id) => {
  const response = await api.post(`/reports/${id}/duplicate`);
  return response.data?.data?.report || null;
};

// Archive a report
export const archiveReport = async (id) => {
  const response = await api.patch(`/reports/${id}`, { status: 'archived' });
  return response.data?.data?.report || null;
};

// Delete a report
export const deleteReport = async (id) => {
  const response = await api.delete(`/reports/${id}`);
  return response.data;
};

// Share a report (update visibility)
export const shareReport = async (id, visibility) => {
  const response = await api.patch(`/reports/${id}`, { visibility });
  return response.data?.data?.report || null;
};
