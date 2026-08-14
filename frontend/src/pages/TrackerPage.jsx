import { useState, useEffect } from 'react';
import ErrorBanner from '../components/ErrorBanner';
import {
  getJobApplications,
  createJobApplication,
  updateJobApplication,
  deleteJobApplication
} from '../api/client';

export default function TrackerPage() {
  const [applications, setApplications] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form states for manual additions
  const [newTitle, setNewTitle] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newSalary, setNewSalary] = useState('');
  const [newLink, setNewLink] = useState('');

  const statusMetrics = [
    { id: 'wishlist', label: 'Wishlist', icon: '📌', color: 'border-[#a855f7]' },
    { id: 'applied', label: 'Applied', icon: '✉️', color: 'border-[#3b82f6]' },
    { id: 'interviewing', label: 'Interview', icon: '💬', color: 'border-[#eab308]' },
    { id: 'offered', label: 'Offered', icon: '🎉', color: 'border-[#22c55e]' },
    { id: 'rejected', label: 'Archive', icon: '📦', color: 'border-[#ef4444]' }
  ];

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const data = await getJobApplications();
      setApplications(data || []);
    } catch (err) {
      console.error('Failed to load applications:', err);
      setError(err.message || 'Failed to load applications');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const moveApp = async (id, newStatus) => {
    try {
      await updateJobApplication(id, { status: newStatus });
      setApplications(prev =>
        prev.map(app => (app.id === id ? { ...app, status: newStatus } : app))
      );
    } catch (err) {
      setError(err.message || 'Failed to update application status');
    }
  };

  const deleteApp = async (id) => {
    try {
      await deleteJobApplication(id);
      setApplications(prev => prev.filter(app => app.id !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete application');
    }
  };

  const handleAddApp = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newCompany.trim()) {
      setError('Job Title and Company are required.');
      return;
    }

    try {
      const newApp = await createJobApplication({
        title: newTitle.trim(),
        company: newCompany.trim(),
        location: newLocation.trim(),
        salary: newSalary.trim(),
        link: newLink.trim(),
        platform: 'Manual Input',
        status: 'wishlist',
      });

      setApplications(prev => [newApp, ...prev]);

      setNewTitle('');
      setNewCompany('');
      setNewLocation('');
      setNewSalary('');
      setNewLink('');
      setShowAddForm(false);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to create application');
    }
  };

  const getCountForStatus = (status) => {
    return applications.filter(app => app.status === status).length;
  };

  const filteredApps = filterStatus === 'all'
    ? applications
    : applications.filter(app => app.status === filterStatus);

  // Monogram color builder based on company name
  const getInitialsColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      'bg-purple-900/20 text-purple-300 border-purple-800/40',
      'bg-blue-900/20 text-blue-300 border-blue-800/40',
      'bg-emerald-900/20 text-emerald-300 border-emerald-800/40',
      'bg-amber-900/20 text-amber-300 border-amber-800/40',
      'bg-indigo-900/20 text-indigo-300 border-indigo-800/40',
      'bg-rose-900/20 text-rose-300 border-rose-800/40'
    ];
    return colors[Math.abs(hash) % colors.length];
  };

  // Card component renderer
  const renderCard = (app) => (
    <div
      key={app.id}
      className="p-4 rounded-lg bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border hover:border-primary/60 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 flex flex-col gap-3 relative group hover:-translate-y-1"
    >
      {/* Delete button - top right corner */}
      <button
        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-error/10 text-error hover:bg-error hover:text-white cursor-pointer border-none opacity-0 group-hover:opacity-100 transition-all duration-200"
        onClick={() => deleteApp(app.id)}
        title="Delete application"
      >
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Company Logo/Monogram */}
      <div className="flex items-start gap-2.5">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold font-mono uppercase shrink-0 shadow-md ${getInitialsColor(app.company)}`}>
          {app.company.slice(0, 2)}
        </div>

        <div className="flex-1 min-w-0 pr-4">
          <h3 className="text-xs font-bold text-text-primary m-0 leading-tight mb-1" title={app.title}>
            {app.title}
          </h3>
          <p className="text-[11px] text-text-secondary font-semibold m-0 flex items-center gap-1">
            <span>🏢</span>
            <span className="truncate">{app.company}</span>
          </p>
        </div>
      </div>

      {/* Metadata Tags */}
      <div className="flex flex-col gap-1.5">
        {app.location && (
          <div className="flex items-center gap-1.5 text-[10px] text-text-secondary">
            <span>📍</span>
            <span className="truncate">{app.location}</span>
          </div>
        )}
        {app.salary && (
          <div className="flex items-center gap-1.5 text-[10px] text-text-secondary">
            <span>💰</span>
            <span className="truncate">{app.salary}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 border border-primary/30 text-[9px] font-semibold text-primary">
            {app.platform}
          </span>
        </div>
      </div>

      {/* Actions Footer */}
      <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
        {app.link && (
          <a
            href={app.link}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md bg-primary/10 hover:bg-primary hover:text-white text-primary text-[11px] font-semibold transition-all duration-200 no-underline"
          >
            <span>View Job</span>
            <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
        )}
        <select
          value={app.status}
          onChange={(e) => moveApp(app.id, e.target.value)}
          className="w-full px-2.5 py-1.5 rounded-md text-[11px] font-medium bg-bg-tertiary border border-border text-text-primary cursor-pointer hover:border-primary focus:border-primary outline-none transition-all"
        >
          <option value="wishlist">📌 Wishlist</option>
          <option value="applied">✉️ Applied</option>
          <option value="interviewing">💬 Interview</option>
          <option value="offered">🎉 Offered</option>
          <option value="rejected">📦 Archive</option>
        </select>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-8 page-wrapper mx-auto max-w-[1200px] w-full px-6 md:px-8">
      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

      {/* Header section */}
      <div className="border-b border-border/80 pb-6 flex justify-between items-end max-md:flex-col max-md:items-start max-md:gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] uppercase tracking-widest font-bold text-primary font-mono">Workflow Management</span>
          <h1 className="text-3xl font-extrabold font-headings text-text-primary tracking-tight m-0 leading-none">Application Tracker</h1>
          <p className="text-text-secondary text-sm m-0 max-w-[60ch]">Track and organize your job applications with our intuitive dashboard.</p>
        </div>

        <button
          className="btn btn-secondary text-sm font-sans flex items-center gap-2 border border-border hover:border-primary transition-all duration-300 max-md:w-full"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Close Form' : '+ Add Application'}
        </button>
      </div>

      {/* Form */}
      {showAddForm && (
        <form onSubmit={handleAddApp} className="p-8 bg-bg-secondary border border-border rounded-md animate-[slideUp_0.25s_cubic-bezier(0.22,1,0.36,1)_forwards]">
          <h3 className="text-base font-bold text-text-primary mb-6">New Application Record</h3>
          <div className="grid grid-cols-2 gap-6 max-sm:grid-cols-1">
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider font-mono">Job Title *</label>
              <input
                type="text"
                placeholder="e.g. Lead Software Engineer"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                className="w-full p-2.5 bg-bg-input border border-border rounded-sm text-sm text-text-primary focus:border-primary outline-none transition-colors"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider font-mono">Company *</label>
              <input
                type="text"
                placeholder="e.g. Anthropic"
                value={newCompany}
                onChange={(e) => setNewCompany(e.target.value)}
                required
                className="w-full p-2.5 bg-bg-input border border-border rounded-sm text-sm text-text-primary focus:border-primary outline-none transition-colors"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider font-mono">Location</label>
              <input
                type="text"
                placeholder="e.g. London / Remote"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                className="w-full p-2.5 bg-bg-input border border-border rounded-sm text-sm text-text-primary focus:border-primary outline-none transition-colors"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider font-mono">Compensation / Salary</label>
              <input
                type="text"
                placeholder="e.g. £90,000 /year"
                value={newSalary}
                onChange={(e) => setNewSalary(e.target.value)}
                className="w-full p-2.5 bg-bg-input border border-border rounded-sm text-sm text-text-primary focus:border-primary outline-none transition-colors"
              />
            </div>
            <div className="flex flex-col gap-2 col-span-2 max-sm:col-span-1">
              <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider font-mono">Listing Link / URL</label>
              <input
                type="url"
                placeholder="https://..."
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                className="w-full p-2.5 bg-bg-input border border-border rounded-sm text-sm text-text-primary focus:border-primary outline-none transition-colors"
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary mt-6">Create Record</button>
        </form>
      )}

      {/* Statistics Metrics Cards */}
      <div className="grid grid-cols-5 gap-4 max-md:grid-cols-2 max-sm:grid-cols-1">
        {statusMetrics.map(metric => {
          const count = getCountForStatus(metric.id);
          return (
            <div
              key={metric.id}
              className={`p-6 bg-bg-secondary border-t-4 ${metric.color} border border-border rounded-md flex flex-col items-center justify-center gap-2 hover:shadow-lg transition-shadow cursor-pointer`}
              onClick={() => setFilterStatus(metric.id)}
            >
              <span className="text-3xl">{metric.icon}</span>
              <span className="text-3xl font-bold text-text-primary">{count}</span>
              <span className="text-xs text-text-secondary font-semibold uppercase tracking-wider text-center">{metric.label}</span>
            </div>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 rounded-md border transition-all whitespace-nowrap text-sm font-semibold ${
            filterStatus === 'all'
              ? 'bg-primary text-white border-primary'
              : 'bg-bg-secondary border-border text-text-secondary hover:border-primary hover:text-text-primary'
          }`}
        >
          All Applications
          <span className="ml-2 text-xs opacity-70">({applications.length})</span>
        </button>

        {statusMetrics.map(status => (
          <button
            key={status.id}
            onClick={() => setFilterStatus(status.id)}
            className={`px-4 py-2 rounded-md border transition-all whitespace-nowrap text-sm font-semibold ${
              filterStatus === status.id
                ? 'bg-primary text-white border-primary'
                : 'bg-bg-secondary border-border text-text-secondary hover:border-primary hover:text-text-primary'
            }`}
          >
            {status.icon} {status.label}
            <span className="ml-2 text-xs opacity-70">({getCountForStatus(status.id)})</span>
          </button>
        ))}
      </div>

      {/* Job Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-text-secondary text-sm">Loading applications...</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
          {filteredApps.length > 0 ? (
            filteredApps.map(app => renderCard(app))
          ) : (
            <div className="col-span-full p-12 text-center bg-bg-secondary border border-dashed border-border rounded-md">
              <span className="text-4xl block mb-4">📋</span>
              <p className="text-text-secondary text-sm m-0">
                {filterStatus === 'all'
                  ? 'No applications yet. Click "+ Add Application" to get started.'
                  : `No applications in ${statusMetrics.find(s => s.id === filterStatus)?.label || 'this'} category.`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
