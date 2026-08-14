import { useState, useEffect, useRef } from 'react';
import JobFilters from '../components/JobFilters';
import JobCard from '../components/JobCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBanner from '../components/ErrorBanner';
import { getJobs, refreshJobs, getJobStatus } from '../api/client';

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(12);
  const [totalPages, setTotalPages] = useState(1);

  const [filters, setFilters] = useState({ search: '', category: '', experience: '', platform: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get tracked job IDs to filter them out from the job list
  const [trackedJobIds, setTrackedJobIds] = useState(() => {
    const saved = localStorage.getItem('trackedJobIds');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    // Save trackedJobIds to localStorage when it changes
    localStorage.setItem('trackedJobIds', JSON.stringify(trackedJobIds));
  }, [trackedJobIds]);

  const [stats, setStats] = useState({ totalCount: 0, categoriesCount: 0, companiesCount: 0 });

  const [scrapingStatus, setScrapingStatus] = useState({ is_running: false, job_count: 0, last_updated: null });
  const pollIntervalRef = useRef(null);

  useEffect(() => {
    loadJobsData();
  }, [filters, page]);

  useEffect(() => {
    checkScraperStatus();
    pollIntervalRef.current = setInterval(checkScraperStatus, 5000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const loadJobsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getJobs({ ...filters, page, per_page: perPage });
      // Filter out already tracked jobs from the job listings
      const filteredJobs = (data.jobs || []).filter(job => !trackedJobIds.includes(job.id));
      setJobs(filteredJobs);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 1);

      if (page === 1) {
        setStats({
          totalCount: data.total || 0,
          categoriesCount: data.categories_count || 0,
          companiesCount: data.companies_count || 0,
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch job opportunities. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const checkScraperStatus = async () => {
    try {
      const status = await getJobStatus();
      setScrapingStatus(status);

      if (!status.is_running && scrapingStatus.is_running) {
        loadJobsData();
      }
    } catch (err) {
      console.error('Failed to get scraping status:', err);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleRefresh = async () => {
    try {
      setError(null);
      await refreshJobs();
      setScrapingStatus(prev => ({ ...prev, is_running: true }));
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = setInterval(checkScraperStatus, 2000);
    } catch (err) {
      setError(err.message || 'Failed to trigger job refresh.');
    }
  };

  const handleJobTracked = (jobId) => {
    // Add job ID to tracked list when a job is tracked
    if (!trackedJobIds.includes(jobId)) {
      setTrackedJobIds(prev => [...prev, jobId]);
    }
  };

  const handleJobUntracked = (jobId) => {
    // Remove job ID from tracked list when a job is untracked
    setTrackedJobIds(prev => prev.filter(id => id !== jobId));
    // Reload jobs data to include the newly untracked job
    loadJobsData();
  };

  return (
    <div className="flex flex-col gap-6 page-wrapper mx-auto max-w-[1200px] w-full px-6 md:px-8">
      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

      <div className="flex justify-between items-center border-b border-border pb-4 mb-4 max-md:flex-col max-md:items-start max-md:gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headings">Find Job Opportunities</h1>
          <p className="text-text-secondary text-sm">Explore openings aligned with SkillSync role categories</p>
        </div>

        <div className="flex items-center gap-4 max-md:w-full max-md:justify-between">
          {scrapingStatus.last_updated && (
            <span className="text-[11px] text-text-secondary">
              Updated: {new Date(scrapingStatus.last_updated).toLocaleDateString()} {new Date(scrapingStatus.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}

          <button
            className={`btn btn-secondary btn-sm ${scrapingStatus.is_running ? 'opacity-70 cursor-not-allowed' : ''}`}
            onClick={handleRefresh}
            disabled={scrapingStatus.is_running}
          >
            {scrapingStatus.is_running ? (
              <span className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 border-2 border-white/30 rounded-full border-t-white animate-spin"></span> Scraping...
              </span>
            ) : (
              '🔄 Refresh Jobs'
            )}
          </button>
        </div>
      </div>

      {scrapingStatus.is_running && (
        <div className="p-4 bg-info/10 border border-info/20 rounded-sm mb-4 text-sm text-text-primary animate-fade-in">
          <p className="m-0">
            🔄 Scrapers are active. Fetching and index compiling the latest job listings.
            Currently in database: <strong className="text-text-primary">{scrapingStatus.job_count}</strong> records.
          </p>
        </div>
      )}

      {/* Filter Bar */}
      <JobFilters onFilterChange={handleFilterChange} initialFilters={filters} />

      {/* Stats Counter Bar */}
      {!loading && jobs.length > 0 && stats.categoriesCount > 0 && (
        <div className="flex justify-around items-center p-4 bg-bg-secondary border border-border rounded-md mb-6 stagger-1 max-sm:flex-col max-sm:gap-4 max-sm:p-6">
          <div className="flex flex-col items-center text-center">
            <span className="text-2xl font-extrabold text-primary">{total}</span>
            <span className="text-[10px] text-text-secondary uppercase tracking-widest font-semibold">Matching Jobs</span>
          </div>
          <div className="h-10 w-[1px] bg-border max-sm:hidden"></div>
          <div className="flex flex-col items-center text-center">
            <span className="text-2xl font-extrabold text-primary">{stats.categoriesCount}</span>
            <span className="text-[10px] text-text-secondary uppercase tracking-widest font-semibold">Categories</span>
          </div>
          <div className="h-10 w-[1px] bg-border max-sm:hidden"></div>
          <div className="flex flex-col items-center text-center">
            <span className="text-2xl font-extrabold text-primary">{stats.companiesCount}</span>
            <span className="text-[10px] text-text-secondary uppercase tracking-widest font-semibold">Unique Companies</span>
          </div>
        </div>
      )}

      {/* Main Grid */}
      {loading ? (
        <div className="flex justify-center items-center min-h-[250px]">
          <LoadingSpinner text="Searching jobs database..." />
        </div>
      ) : jobs.length > 0 ? (
        <>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6 mb-8">
            {jobs.map((job, idx) => (
              <JobCard
                key={idx}
                job={job}
                isTracked={trackedJobIds.includes(job.id)}
                onJobTracked={handleJobTracked}
                onJobUntracked={handleJobUntracked}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 border-t border-border pt-6 flex justify-center items-center gap-4">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
              >
                ◀ Previous
              </button>

              <span className="text-sm text-text-secondary">
                Page <strong className="text-text-primary">{page}</strong> of <strong className="text-text-primary">{totalPages}</strong>
              </span>

              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
              >
                Next ▶
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="p-12 text-center flex flex-col items-center gap-4 bg-bg-secondary border border-border rounded-md animate-[scaleIn_0.85s_cubic-bezier(0.22,1,0.36,1)_forwards]">
          <h3 className="text-lg font-bold text-text-primary m-0">No matching jobs found</h3>
          <p className="text-sm text-text-secondary m-0">Try clearing some filters, selecting a different category, or refresh the database.</p>
          <button className="btn btn-primary btn-sm" onClick={handleRefresh}>
            Trigger Live Database Scrape
          </button>
        </div>
      )}
    </div>
  );
}