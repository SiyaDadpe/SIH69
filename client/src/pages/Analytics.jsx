import React, { useEffect, useState } from 'react';
import AnalyticsDashboard from '../sections/reports/AnalyticsDashboard';
import { fetchReports } from '../services/reportService';

export default function Analytics() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function loadReports() {
            try {
                setLoading(true);
                setError(null);
                const { reports } = await fetchReports();
                setReports(reports);
            } catch (err) {
                setError('Failed to load reports');
            } finally {
                setLoading(false);
            }
        }
        loadReports();
    }, []);

    if (loading) return <div>Loading analytics...</div>;
    if (error) return <div>{error}</div>;

    return <AnalyticsDashboard reports={reports} />;
}