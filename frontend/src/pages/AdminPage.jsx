import { useState, useEffect } from 'react';
import ErrorBanner from '../components/ErrorBanner';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  getAdminStats,
  getAdminUsers,
  updateUserRole,
  deleteUser,
  getJobs,
  createAdminJob,
  updateAdminJob,
  deleteAdminJob,
  getScraperLogs,
  getJobStatus,
  refreshJobs,
} from '../api/client';

const EMPTY_JOB_FORM = {
  title: '',
  company: '',
  location: '',
  category: 'React Developer',
  salary: '',
  experience: 'Fresher',
  platform: 'LinkedIn',
  link: '',
};

const TABS = [
  { id: 'overview', label: '📊 Dashboard Overview' },
  { id: 'scraper', label: '🕷️ Scraper Panel' },
  { id: 'jobs', label: '💼 Job Listings' },
  { id: 'users', label: '👥 User Base' },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('overview');

  // Data states
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [logs, setLogs] = useState([]);
  const [scrapeStatus, setScrapeStatus] = useState({ is_running: false });

  // UI states
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [jobSearch, setJobSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // Job modal state
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [jobForm, setJobForm] = useState(EMPTY_JOB_FORM);

  // User details modal state
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, usersData, jobsData, logsData, statusData] = await Promise.all([
        getAdminStats(),
        getAdminUsers(),
        getJobs({ per_page: 100 }),
        getScraperLogs(),
        getJobStatus(),
      ]);
      setStats(statsData);
      setUsers(usersData || []);
      setJobs((jobsData && jobsData.jobs) || []);
      setLogs(logsData || []);
      setScrapeStatus(statusData || { is_running: false });
    } catch (err) {
      setError(err.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const reloadJobs = async () => {
    try {
      const data = await getJobs({ per_page: 100 });
      setJobs((data && data.jobs) || []);
    } catch (err) {
      setError(err.message || 'Failed to reload jobs');
    }
  };

  const reloadUsers = async () => {
    try {
      const data = await getAdminUsers();
      setUsers(data || []);
    } catch (err) {
      setError(err.message || 'Failed to reload users');
    }
  };

  // ==========================================================================
  // Scraper
  // ==========================================================================
  const handleStartScrape = async () => {
    setError(null);
    try {
      await refreshJobs();
      setScrapeStatus((prev) => ({ ...prev, is_running: true }));
      showSuccess('Scraping session started successfully!');
      // Poll status until the scrape finishes
      const poll = setInterval(async () => {
        try {
          const status = await getJobStatus();
          setScrapeStatus(status);
          if (!status.is_running) {
            clearInterval(poll);
            await reloadJobs();
            const logsData = await getScraperLogs();
            setLogs(logsData || []);
            const statsData = await getAdminStats();
            setStats(statsData);
            showSuccess('Scraping completed! Jobs database updated.');
          }
        } catch (pollErr) {
          clearInterval(poll);
          setError(pollErr.message || 'Failed to check scrape status');
        }
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to start scraping');
    }
  };

  // ==========================================================================
  // Jobs CRUD
  // ==========================================================================
  const openAddJob = () => {
    setEditingJob(null);
    setJobForm(EMPTY_JOB_FORM);
    setIsJobModalOpen(true);
  };

  const openEditJob = (job) => {
    setEditingJob(job);
    setJobForm({
      title: job.title,
      company: job.company,
      location: job.location,
      category: job.category,
      salary: job.salary,
      experience: job.experience,
      platform: job.platform,
      link: job.link,
    });
    setIsJobModalOpen(true);
  };

  const handleSaveJob = async (e) => {
    e.preventDefault();
    if (!jobForm.title.trim() || !jobForm.company.trim()) return;

    setError(null);
    try {
      if (editingJob) {
        await updateAdminJob(editingJob.id, jobForm);
        showSuccess('Job listing updated successfully!');
      } else {
        await createAdminJob(jobForm);
        showSuccess('New job added successfully!');
      }
      setIsJobModalOpen(false);
      await reloadJobs();
    } catch (err) {
      setError(err.message || 'Failed to save job');
    }
  };

  const handleDeleteJob = async (id) => {
    setError(null);
    try {
      await deleteAdminJob(id);
      await reloadJobs();
      showSuccess('Job listing deleted successfully!');
    } catch (err) {
      setError(err.message || 'Failed to delete job');
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const term = jobSearch.toLowerCase();
    return (
      !term ||
      job.title.toLowerCase().includes(term) ||
      job.company.toLowerCase().includes(term) ||
      job.location.toLowerCase().includes(term)
    );
  });

  // ==========================================================================
  // Users management
  // ==========================================================================
  const handleToggleRole = async (user) => {
    setError(null);
    const nextRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      await updateUserRole(user.id, nextRole);
      await reloadUsers();
      showSuccess(`Role updated to ${nextRole} successfully!`);
    } catch (err) {
      setError(err.message || 'Failed to update user role');
    }
  };

  const handleDeleteUser = async (user) => {
    setError(null);
    if (!window.confirm(`Delete user "${user.full_name}"? This cannot be undone.`)) return;
    try {
      await deleteUser(user.id);
      await reloadUsers();
      showSuccess('User account deleted.');
    } catch (err) {
      setError(err.message || 'Failed to delete user');
    }
  };

  const filteredUsers = users.filter((user) => {
    const term = userSearch.toLowerCase();
    return (
      !term ||
      (user.full_name || '').toLowerCase().includes(term) ||
      (user.email || '').toLowerCase().includes(term)
    );
  });

  // ==========================================================================
  // Derived data
  // ==========================================================================
  const avgScore = stats ? `${Math.round(stats.avg_match_score || 0)}%` : '—';
  const scraperLabel = scrapeStatus.is_running ? 'Scraping' : (scrapeStatus.status === 'never_run' ? 'Never Run' : scrapeStatus.status);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner text="Loading admin control center..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 page-wrapper mx-auto max-w-[1200px] w-full px-6 md:px-8">
      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

      {successMsg && (
        <div className="fixed bottom-6 right-6 p-4 bg-success-bg border border-success-border rounded-sm text-success font-medium text-sm z-[2000] shadow-2xl flex items-center gap-2 animate-[slideUp_0.95s_cubic-bezier(0.22,1,0.36,1)_forwards]">
          <span>✨</span>
          <span>{successMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative p-8 bg-bg-secondary border border-border rounded-md overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-primary to-secondary" />
        <div className="flex justify-between items-center max-md:flex-col max-md:gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1 max-md:justify-center">
              <span className="badge badge-success text-[10px] uppercase font-bold tracking-wider">Super Administrator</span>
            </div>
            <h1 className="text-3xl font-bold font-headings text-text-primary tracking-tight max-md:text-center">
              System Admin Control Center
            </h1>
            <p className="text-text-secondary text-sm m-0 max-md:text-center">
              Monitor job scraping status, manage jobs and users.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="text-xs bg-bg-tertiary px-3 py-1.5 border border-border rounded-sm text-text-secondary flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${scrapeStatus.is_running ? 'bg-warning' : 'bg-success'}`}></span>
              API Gateway: {scrapeStatus.is_running ? 'Scraping' : 'Connected'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border gap-2 overflow-x-auto pb-px">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 text-sm font-semibold text-text-secondary border-b-2 bg-transparent border-transparent hover:text-text-primary cursor-pointer transition-all duration-300 whitespace-nowrap ${
              activeTab === tab.id ? '!border-primary !text-text-primary bg-bg-secondary rounded-t-sm' : ''
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-4 gap-6 max-lg:grid-cols-2 max-md:grid-cols-1">
            <div className="p-6 bg-bg-secondary border border-border rounded-md">
              <span className="text-xs text-text-secondary font-semibold uppercase tracking-wider mb-2 block">Total Jobs Scraped</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-primary font-headings">{stats ? stats.total_jobs : 0}</span>
              </div>
            </div>
            <div className="p-6 bg-bg-secondary border border-border rounded-md">
              <span className="text-xs text-text-secondary font-semibold uppercase tracking-wider mb-2 block">Active User Accounts</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-text-primary font-headings">{stats ? stats.total_users : 0}</span>
              </div>
            </div>
            <div className="p-6 bg-bg-secondary border border-border rounded-md">
              <span className="text-xs text-text-secondary font-semibold uppercase tracking-wider mb-2 block">Avg. ATS Match Rate</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-text-primary font-headings">{avgScore}</span>
              </div>
            </div>
            <div className="p-6 bg-bg-secondary border border-border rounded-md">
              <span className="text-xs text-text-secondary font-semibold uppercase tracking-wider mb-2 block">Scraper Status</span>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-extrabold font-headings ${scrapeStatus.is_running ? 'text-warning' : 'text-text-primary'}`}>{scraperLabel}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-[1.5fr_1fr] gap-8 max-lg:grid-cols-1">
            <div className="p-8 bg-bg-secondary border border-border rounded-md flex flex-col gap-6">
              <div>
                <h3 className="text-lg font-bold m-0 text-text-primary">🕷️ Recent Scrape Activity</h3>
                <p className="text-xs text-text-secondary m-0">Latest automated and manual scrape session outputs</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border text-text-secondary font-bold">
                      <th className="py-3 px-2">Started At</th>
                      <th className="py-3 px-2">Jobs Found</th>
                      <th className="py-3 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.length > 0 ? (
                      logs.slice(0, 5).map((log) => (
                        <tr key={log.id} className="border-b border-border hover:bg-bg-tertiary transition-colors">
                          <td className="py-3 px-2 text-text-secondary font-mono">
                            {log.started_at ? new Date(log.started_at).toLocaleString() : '—'}
                          </td>
                          <td className="py-3 px-2 font-bold text-text-primary">{log.job_count}</td>
                          <td className="py-3 px-2">
                            <span className={`badge ${log.status === 'completed' ? 'badge-success' : 'badge-error'} text-[9px] font-bold uppercase`}>
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="py-6 text-center text-text-tertiary">No scrape runs yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-8 bg-bg-secondary border border-border rounded-md flex flex-col gap-6">
              <div>
                <h3 className="text-lg font-bold m-0 text-text-primary">🛡️ System Pulse</h3>
                <p className="text-xs text-text-secondary m-0">Overall server diagnostic health checks</p>
              </div>
              <div className="flex flex-col gap-3.5">
                <div className="flex justify-between items-center p-3.5 bg-bg-tertiary rounded-sm border border-border">
                  <span className="text-xs font-semibold text-text-primary">Database Sync</span>
                  <span className="badge badge-success text-[10px] font-bold">Healthy</span>
                </div>
                <div className="flex justify-between items-center p-3.5 bg-bg-tertiary rounded-sm border border-border">
                  <span className="text-xs font-semibold text-text-primary">Registered Admins</span>
                  <span className="text-xs font-bold text-text-primary">{stats ? stats.total_admins : 0}</span>
                </div>
                <div className="flex justify-between items-center p-3.5 bg-bg-tertiary rounded-sm border border-border">
                  <span className="text-xs font-semibold text-text-primary">Jobs In Database</span>
                  <span className="text-xs font-bold text-text-primary">{stats ? stats.total_jobs : 0}</span>
                </div>
                <div className="flex justify-between items-center p-3.5 bg-bg-tertiary rounded-sm border border-border">
                  <span className="text-xs font-semibold text-text-primary">Scraper Status</span>
                  <span className="text-xs font-bold text-text-secondary">{scraperLabel}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SCRAPER */}
      {activeTab === 'scraper' && (
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-[1.2fr_1.8fr] gap-8 max-lg:grid-cols-1">
            <div className="p-8 bg-bg-secondary border border-border rounded-md flex flex-col gap-6 h-fit">
              <div>
                <h3 className="text-lg font-bold m-0 text-text-primary">Manual Scraper Trigger</h3>
                <p className="text-xs text-text-secondary m-0">Trigger immediate crawler sync for jobs board updates</p>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-text-secondary">Jobs currently in database</span>
                  <span className="text-2xl font-extrabold text-primary">{scrapeStatus.job_count}</span>
                </div>

                <button
                  onClick={handleStartScrape}
                  disabled={scrapeStatus.is_running}
                  className={`btn btn-primary w-full ${scrapeStatus.is_running ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {scrapeStatus.is_running ? '🕷️ Scraping in progress...' : '🚀 Start Scraping Session'}
                </button>

                {scrapeStatus.last_updated && (
                  <p className="text-[11px] text-text-tertiary m-0">
                    Last updated: {new Date(scrapeStatus.last_updated).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            <div className="p-8 bg-bg-secondary border border-border rounded-md flex flex-col gap-4">
              <div>
                <h3 className="text-lg font-bold m-0 text-text-primary">Scrape History Log</h3>
                <p className="text-xs text-text-secondary m-0">Recent automated and manual scrape session outputs</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border text-text-secondary font-bold">
                      <th className="py-3 px-2">Started At</th>
                      <th className="py-3 px-2">Completed At</th>
                      <th className="py-3 px-2">Jobs Found</th>
                      <th className="py-3 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.length > 0 ? (
                      logs.map((log) => (
                        <tr key={log.id} className="border-b border-border hover:bg-bg-tertiary transition-colors">
                          <td className="py-3 px-2 text-text-secondary font-mono">
                            {log.started_at ? new Date(log.started_at).toLocaleString() : '—'}
                          </td>
                          <td className="py-3 px-2 text-text-secondary font-mono">
                            {log.completed_at ? new Date(log.completed_at).toLocaleString() : '—'}
                          </td>
                          <td className="py-3 px-2 font-bold text-text-primary">{log.job_count}</td>
                          <td className="py-3 px-2">
                            <span className={`badge ${log.status === 'completed' ? 'badge-success' : 'badge-error'} text-[9px] font-bold uppercase`}>
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="py-8 text-center text-text-tertiary">
                          No scrape runs yet. Trigger your first scrape session.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: JOB LISTINGS */}
      {activeTab === 'jobs' && (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center gap-4 max-md:flex-col max-md:items-stretch">
            <div className="flex gap-4 grow max-md:flex-col">
              <input
                type="text"
                placeholder="Search job title, company, or location..."
                value={jobSearch}
                onChange={(e) => setJobSearch(e.target.value)}
                className="grow"
              />
            </div>
            <button onClick={openAddJob} className="btn btn-primary whitespace-nowrap">
              ➕ Add Job Manually
            </button>
          </div>

          <div className="bg-bg-secondary border border-border rounded-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border text-text-secondary font-bold bg-bg-tertiary">
                    <th className="py-3.5 px-4">Title & Company</th>
                    <th className="py-3.5 px-2">Location</th>
                    <th className="py-3.5 px-2">Experience</th>
                    <th className="py-3.5 px-2">Category</th>
                    <th className="py-3.5 px-2">Platform</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.length > 0 ? (
                    filteredJobs.map((job) => (
                      <tr key={job.id} className="border-b border-border hover:bg-bg-tertiary transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-text-primary text-sm">{job.title}</span>
                            <span className="text-text-secondary text-[11px]">{job.company} • {job.salary}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-2 text-text-secondary">{job.location}</td>
                        <td className="py-3.5 px-2 text-text-secondary">{job.experience}</td>
                        <td className="py-3.5 px-2">
                          <span className="bg-bg-tertiary border border-border px-2 py-0.5 rounded-sm text-[10px] text-text-primary font-semibold">
                            {job.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-2">
                          <span className="badge badge-info text-[9px] font-bold uppercase">{job.platform}</span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => openEditJob(job)}
                              className="p-1 text-primary hover:bg-success-bg border border-transparent hover:border-success-border rounded-sm transition-colors cursor-pointer"
                              title="Edit job"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeleteJob(job.id)}
                              className="p-1 text-error hover:bg-error-bg border border-transparent hover:border-error-border rounded-sm transition-colors cursor-pointer"
                              title="Delete job"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-text-tertiary">
                        No jobs match the current filter or search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: USER BASE */}
      {activeTab === 'users' && (
        <div className="flex flex-col gap-6">
          <div className="flex gap-4 items-center">
            <input
              type="text"
              placeholder="Search user by name or email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="grow"
            />
          </div>

          <div className="bg-bg-secondary border border-border rounded-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border text-text-secondary font-bold bg-bg-tertiary">
                    <th className="py-3.5 px-4">User Details</th>
                    <th className="py-3.5 px-2">Role</th>
                    <th className="py-3.5 px-2">Joined</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-border hover:bg-bg-tertiary transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-text-primary text-sm">{user.full_name}</span>
                            <span className="text-text-secondary text-[11px] font-mono">{user.email}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-2">
                          <span className={`badge ${user.role === 'admin' ? 'badge-error' : 'badge-info'} text-[9px] font-bold uppercase`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 text-text-secondary font-mono">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => setSelectedUser(user)}
                              className="btn btn-secondary btn-sm px-2"
                              title="View Full Details"
                            >
                              🔍 View
                            </button>
                            <button
                              onClick={() => handleToggleRole(user)}
                              className="btn btn-ghost btn-sm px-2 hover:text-warning"
                              title="Toggle Role"
                            >
                              🛡️ Role
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="p-1 text-error hover:bg-error-bg border border-transparent hover:border-error-border rounded-sm transition-colors cursor-pointer"
                              title="Delete User"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center py-8 text-text-tertiary">
                        No users matching search filters found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD/EDIT JOB */}
      {isJobModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex justify-center items-center p-6">
          <div className="bg-bg-secondary border border-border rounded-md max-w-[500px] w-full p-8 relative flex flex-col gap-6 animate-[scaleIn_0.25s_ease-out_forwards] max-h-[90vh] overflow-y-auto">
            <div>
              <h3 className="text-xl font-bold font-headings text-text-primary m-0">
                {editingJob ? '✏️ Edit Job listing' : '➕ Create Job listing'}
              </h3>
              <p className="text-xs text-text-secondary m-0">Configure fields for rendering on user career portals</p>
            </div>

            <form onSubmit={handleSaveJob} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Job Title</label>
                <input
                  type="text"
                  required
                  value={jobForm.title}
                  onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                  placeholder="e.g. Lead React Developer"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Company Name</label>
                  <input
                    type="text"
                    required
                    value={jobForm.company}
                    onChange={(e) => setJobForm({ ...jobForm, company: e.target.value })}
                    placeholder="e.g. Razorpay"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Location</label>
                  <input
                    type="text"
                    required
                    value={jobForm.location}
                    onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                    placeholder="e.g. Remote"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Category Group</label>
                  <input
                    type="text"
                    value={jobForm.category}
                    onChange={(e) => setJobForm({ ...jobForm, category: e.target.value })}
                    placeholder="e.g. React Developer"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Platform</label>
                  <select
                    value={jobForm.platform}
                    onChange={(e) => setJobForm({ ...jobForm, platform: e.target.value })}
                    className="cursor-pointer"
                  >
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Indeed">Indeed</option>
                    <option value="Internshala">Internshala</option>
                    <option value="TimesJobs">TimesJobs</option>
                    <option value="Manual">Manual</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Salary Range</label>
                  <input
                    type="text"
                    value={jobForm.salary}
                    onChange={(e) => setJobForm({ ...jobForm, salary: e.target.value })}
                    placeholder="e.g. ₹8L - ₹12L"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Experience Requirement</label>
                  <select
                    value={jobForm.experience}
                    onChange={(e) => setJobForm({ ...jobForm, experience: e.target.value })}
                    className="cursor-pointer"
                  >
                    <option value="Fresher">Fresher</option>
                    <option value="1-3 Years">1-3 Years</option>
                    <option value="3-5 Years">3-5 Years</option>
                    <option value="5+ Years">5+ Years</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Source Application URL</label>
                <input
                  type="url"
                  required
                  value={jobForm.link}
                  onChange={(e) => setJobForm({ ...jobForm, link: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsJobModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: USER PROFILE DETAILS */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex justify-center items-center p-6">
          <div className="bg-bg-secondary border border-border rounded-md max-w-[550px] w-full p-8 relative flex flex-col gap-6 animate-[scaleIn_0.25s_ease-out_forwards] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-border pb-4">
              <div>
                <h3 className="text-xl font-bold font-headings text-text-primary m-0">{selectedUser.full_name}</h3>
                <span className="text-xs text-text-secondary font-mono">{selectedUser.email}</span>
              </div>
              <span className={`badge ${selectedUser.role === 'admin' ? 'badge-error' : 'badge-info'} text-[10px] font-bold uppercase`}>
                {selectedUser.role}
              </span>
            </div>

            <div className="flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-bg-tertiary p-3 rounded-sm border border-border">
                  <span className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider block mb-1">User ID</span>
                  <span className="text-text-primary font-bold">#{selectedUser.id}</span>
                </div>
                <div className="bg-bg-tertiary p-3 rounded-sm border border-border">
                  <span className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider block mb-1">Joined</span>
                  <span className="text-text-primary font-bold">
                    {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : '—'}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-border pt-4 mt-2">
                <button onClick={() => setSelectedUser(null)} className="btn btn-primary btn-sm px-4">
                  Close details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
