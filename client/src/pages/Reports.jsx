import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { getUserLCAReports } from '@/services/lcaService';
import LCAReportCard from '@/sections/reports/LCAReportCard';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const PAGE_SIZE = 12;

const Reports = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [lcaReports, setLcaReports] = useState([]);
    const [loadingReports, setLoadingReports] = useState(true);
    const [initialLoad, setInitialLoad] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalReports, setTotalReports] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // Load LCA reports
    useEffect(() => {
        setLoadingReports(true);
        const params = {
            page: currentPage,
            limit: PAGE_SIZE,
        };
        if (searchTerm.trim()) {
            params.search = searchTerm.trim();
        }

        getUserLCAReports(params)
            .then((response) => {
                console.log('📊 LCA Reports Response:', response);
                const reports = response.data?.reports || [];
                const pagination = response.data?.pagination || {};
                
                setLcaReports(Array.isArray(reports) ? reports : []);
                setTotalReports(pagination.total || 0);
                setTotalPages(pagination.pages || 1);
            })
            .catch((err) => {
                console.error('Failed to load LCA reports:', err);
                setLcaReports([]);
                setTotalReports(0);
                setTotalPages(1);
                toast.error('Failed to load LCA reports');
            })
            .finally(() => {
                setLoadingReports(false);
                setInitialLoad(false);
            });
    }, [searchTerm, currentPage]);

    return (
        <div className="min-h-screen bg-[#F8F6F3] p-6">
            {initialLoad ? (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#BA7967] mx-auto mb-4"></div>
                        <p className="text-[#6b5b59]">Loading reports...</p>
                    </div>
                </div>
            ) : (
                <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-[#181814] mb-2">LCA Reports</h1>
                    <p className="text-[#6b5b59]">
                        View and manage your Life Cycle Assessment reports
                    </p>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6b5b59]" />
                        <Input
                            type="text"
                            placeholder="Search reports..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 border-[#E6E1D7] focus:ring-[#BA7967] focus:border-[#BA7967]"
                        />
                    </div>
                </div>

                {/* Reports Count */}
                <div className="mb-4">
                    <p className="text-sm text-[#6b5b59]">
                        {loadingReports ? 'Loading...' : `${totalReports} report${totalReports !== 1 ? 's' : ''} found`}
                    </p>
                </div>

                {/* Reports Grid */}
                {loadingReports ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="space-y-3">
                                <Skeleton className="h-48 w-full rounded-lg" />
                            </div>
                        ))}
                    </div>
                ) : lcaReports.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#E6E1D7] mb-4">
                            <Search className="h-8 w-8 text-[#6b5b59]" />
                        </div>
                        <h3 className="text-xl font-semibold text-[#181814] mb-2">
                            No reports found
                        </h3>
                        <p className="text-[#6b5b59]">
                            {searchTerm ? 'Try adjusting your search' : 'Create your first LCA report to get started'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {lcaReports.map((report) => (
                                <LCAReportCard
                                    key={report._id || report.workflowId}
                                    report={report}
                                    viewMode="grid"
                                />
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="mt-8 flex justify-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 rounded-lg border border-[#E6E1D7] bg-white text-[#181814] hover:bg-[#F8F6F3] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <span className="px-4 py-2 text-[#6b5b59]">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 rounded-lg border border-[#E6E1D7] bg-white text-[#181814] hover:bg-[#F8F6F3] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
                </div>
            )}
        </div>
    );
};

export default Reports;
