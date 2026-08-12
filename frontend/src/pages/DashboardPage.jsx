import { useState, useEffect } from 'react';
import ErrorBanner from '../components/ErrorBanner';
import { getRoles, getUserHistory, getUserStats, compareResumes } from '../api/client';

export default function DashboardPage() {
  const [history, setHistory] = useState([]);
  const [rolesList, setRolesList] = useState([]);
  const [userStats, setUserStats] = useState({ applications_count: 0 });
  const [error, setError] = useState(null);

  // Resume Comparison states
  const [targetRole, setTargetRole] = useState('');
  const [resumeA, setResumeA] = useState('');
  const [resumeB, setResumeB] = useState('');
  const [compResults, setCompResults] = useState(null);
  const [isComparing, setIsComparing] = useState(false);

  // Chart zoom state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: null });

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    // Reset visible range when history changes
    if (history.length > 0) {
      setVisibleRange({ start: 0, end: history.length });
    }
  }, [history]);

  const loadDashboardData = async () => {
    try {
      // 1. Roles list for dropdown
      const rolesData = await getRoles();
      setRolesList(rolesData.roles || []);
      if (rolesData.roles && rolesData.roles.length > 0) {
        setTargetRole(rolesData.roles[0]);
      }

      // 2. Load user's analysis history from backend
      try {
        const historyData = await getUserHistory();
        setHistory(historyData || []);
      } catch (histErr) {
        console.error('Failed to load history:', histErr);
        setHistory([]);
      }

      // 3. Load user stats for achievements
      try {
        const statsData = await getUserStats();
        setUserStats(statsData || { applications_count: 0 });
      } catch (statsErr) {
        console.error('Failed to load user stats:', statsErr);
      }
    } catch (err) {
      console.error('Failed to initialize dashboard:', err);
      setError('Could not establish contact with backend.');
    }
  };

  // Zoom controls
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.5, 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setVisibleRange({ start: 0, end: history.length });
  };

  // Server-side resume comparison
  const handleCompare = async (e) => {
    e.preventDefault();
    if (!resumeA.trim() || !resumeB.trim() || !targetRole) {
      setError('Please fill in both resumes and select a target role.');
      return;
    }

    setIsComparing(true);
    setError(null);

    try {
      const result = await compareResumes(resumeA, resumeB, targetRole);

      setCompResults({
        role: result.role,
        resA: {
          score: result.resume_a_score,
          matched: result.resume_a_matched,
          missing: result.resume_a_missing
        },
        resB: {
          score: result.resume_b_score,
          matched: result.resume_b_matched,
          missing: result.resume_b_missing
        }
      });
    } catch (err) {
      setError(err.message || 'Failed to compare resumes');
    } finally {
      setIsComparing(false);
    }
  };

  // SVG drawing dimensions for Growth chart
  const chartWidth = 800 * zoomLevel;
  const chartHeight = 200;
  const padding = 40;
  const bottomPadding = 80; // Extra space for rotated labels

  // Filter history based on visible range
  const visibleHistory = history.slice(
    visibleRange.start,
    visibleRange.end || history.length
  );

  const points = visibleHistory.map((h, index) => {
    if (visibleHistory.length <= 1) return { x: chartWidth / 2, y: chartHeight / 2 };
    const x = padding + (index / (visibleHistory.length - 1)) * (chartWidth - padding * 2);
    // score is out of 10, so convert to percentage y-coord
    const y = chartHeight - bottomPadding - (h.score / 10) * (chartHeight - padding - bottomPadding);
    return { x, y, ...h };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Derived achievement values from real history data
  const peakScore = history.length > 0
    ? Math.round(Math.max(...history.map(h => h.score)) * 10)
    : 0;
  const scanCount = history.length;
  const atsWarriorUnlocked = history.some(h => h.score >= 7);
  const organiserUnlocked = userStats.applications_count > 0;

  return (
    <div className="flex flex-col gap-8 page-wrapper mx-auto max-w-[1200px] w-full px-6 md:px-8">
      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

      <div className="border-b border-border pb-4 mb-4">
        <h1 className="text-3xl font-bold font-headings text-text-primary">Growth Dashboard</h1>
        <p className="text-text-secondary text-sm">Track your score history, achievements, and compare resume profiles</p>
      </div>

      <div className="grid grid-cols-[1.8fr_1fr] gap-8 max-lg:grid-cols-1">
        {/* Left Card: Score line chart */}
        <div className="p-8 bg-bg-secondary border border-border rounded-md">
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-lg font-bold m-0">📈 Score Growth Tracking</h3>
            {history.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleZoomOut}
                  className="px-2 py-1 text-xs bg-bg-tertiary border border-border rounded hover:border-primary transition-colors"
                  title="Zoom Out"
                >
                  🔍−
                </button>
                <button
                  onClick={handleResetZoom}
                  className="px-2 py-1 text-xs bg-bg-tertiary border border-border rounded hover:border-primary transition-colors"
                  title="Reset Zoom"
                >
                  ↺
                </button>
                <button
                  onClick={handleZoomIn}
                  className="px-2 py-1 text-xs bg-bg-tertiary border border-border rounded hover:border-primary transition-colors"
                  title="Zoom In"
                >
                  🔍+
                </button>
                <span className="text-xs text-text-tertiary ml-2">{Math.round(zoomLevel * 100)}%</span>
              </div>
            )}
          </div>
          <p className="text-sm text-text-secondary mb-6">Track your match scores progression over time</p>

          {history.length > 0 ? (
            <div className="w-full pt-4 overflow-x-auto">
              <svg className="min-w-full h-auto" viewBox={`0 0 ${chartWidth} ${chartHeight + bottomPadding}`}>
                {/* Horizontal grid lines */}
                {[0, 0.25, 0.5, 0.75, 1.0].map((ratio, idx) => {
                  const y = chartHeight - bottomPadding - ratio * (chartHeight - padding - bottomPadding);
                  return (
                    <g key={idx}>
                      <line x1={padding} y1={y} x2={chartWidth - padding} y2={y} className="stroke-white/5 stroke-[1px]" />
                      <text x={padding - 8} y={y + 4} className="fill-current text-text-tertiary text-[10px] font-medium font-sans" textAnchor="end">
                        {ratio * 100}%
                      </text>
                    </g>
                  );
                })}

                {/* Growth line */}
                <path d={linePath} className="fill-none stroke-primary stroke-[2.5px] stroke-round stroke-linejoin" />

                {/* Interactive Points */}
                {points.map((p, idx) => {
                  // Format date and time properly
                  const dateTime = new Date(p.date);
                  const dateStr = dateTime.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
                  const timeStr = dateTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

                  return (
                    <g key={idx} className="cursor-pointer">
                      <circle cx={p.x} cy={p.y} r="5" className="fill-primary stroke-bg-primary stroke-2" />
                      <circle cx={p.x} cy={p.y} r="8" className="fill-primary opacity-15 animate-ping" style={{ animationDuration: '3s' }} />
                      <text x={p.x} y={p.y - 12} className="fill-current text-text-primary text-[9px] font-bold font-sans" textAnchor="middle">
                        {Math.round(p.score * 10)}%
                      </text>

                      {/* Rotated date label */}
                      <text
                        x={p.x}
                        y={chartHeight - bottomPadding + 15}
                        transform={`rotate(-90 ${p.x} ${chartHeight - bottomPadding + 15})`}
                        className="fill-current text-text-secondary text-[9px] font-medium font-sans"
                        textAnchor="end"
                      >
                        {dateStr}
                      </text>

                      {/* Rotated time label */}
                      <text
                        x={p.x}
                        y={chartHeight - bottomPadding + 27}
                        transform={`rotate(-90 ${p.x} ${chartHeight - bottomPadding + 27})`}
                        className="fill-current text-text-tertiary text-[8px] font-normal font-sans"
                        textAnchor="end"
                      >
                        {timeStr}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          ) : (
            <p className="text-text-tertiary text-sm text-center py-8">No scans logged yet. Upload your resume on the Home page to start tracking.</p>
          )}
        </div>

        {/* Right Card: Achievements & Stats */}
        <div className="p-8 bg-bg-secondary border border-border rounded-md flex flex-col gap-6">
          <h3 className="text-lg font-bold m-0">🏆 Achievements & Stats</h3>
          <div className="flex flex-col gap-3">
            <div className="bg-bg-tertiary border border-border p-4 rounded-md flex justify-start items-center gap-4">
              <span className="text-2xl">🔥</span>
              <div>
                <h4 className="text-[10px] text-text-secondary uppercase tracking-widest font-semibold m-0">Resumes Scanned</h4>
                <p className="text-sm text-text-primary font-bold m-0">{scanCount} Analysis{scanCount === 1 ? '' : 'es'}</p>
              </div>
            </div>
            <div className="bg-bg-tertiary border border-border p-4 rounded-md flex justify-start items-center gap-4">
              <span className="text-2xl">🎓</span>
              <div>
                <h4 className="text-[10px] text-text-secondary uppercase tracking-widest font-semibold m-0">Peak Match Score</h4>
                <p className="text-sm text-text-primary font-bold m-0">{peakScore}%</p>
              </div>
            </div>
          </div>

          <h4 className="text-[10px] uppercase text-text-tertiary tracking-wider font-bold mt-2">Unlocked Badges</h4>
          <div className="grid grid-cols-3 gap-2">
            <div
              className={`bg-bg-card border border-border px-2 py-3 rounded-sm flex flex-col items-center text-center gap-0.5 ${atsWarriorUnlocked ? '' : 'opacity-40 border-dashed'}`}
              title={atsWarriorUnlocked ? 'Scored over 70% in any tech role' : 'Locked: Score over 70% in any tech role'}
            >
              <span className="text-lg">{atsWarriorUnlocked ? '🎖️' : '🔒'}</span>
              <span className="text-[8px] font-bold text-text-secondary">ATS Warrior</span>
            </div>
            <div
              className={`bg-bg-card border border-border px-2 py-3 rounded-sm flex flex-col items-center text-center gap-0.5 ${organiserUnlocked ? '' : 'opacity-40 border-dashed'}`}
              title={organiserUnlocked ? 'Tracked a job application' : 'Locked: Add a job to your Tracker'}
            >
              <span className="text-lg">{organiserUnlocked ? '📁' : '🔒'}</span>
              <span className="text-[8px] font-bold text-text-secondary">Organiser</span>
            </div>
            <div className="bg-bg-card border border-border px-2 py-3 rounded-sm flex flex-col items-center text-center gap-0.5 opacity-40 border-dashed" title="Locked: Complete 3 learning courses to unlock">
              <span className="text-lg">🔒</span>
              <span className="text-[8px] font-bold text-text-secondary">Dev Master</span>
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison section */}
      <div className="p-8 bg-bg-secondary border border-border rounded-md flex flex-col gap-4">
        <h3 className="text-lg font-bold m-0">⚖️ Side-by-Side Resume Comparison</h3>
        <p className="text-sm text-text-secondary mb-2">Compare two different resume versions against a target role to find the best match</p>

        <form onSubmit={handleCompare} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5 max-w-[250px]">
            <label htmlFor="compare-role" className="text-xs font-semibold text-text-secondary">Select Target Role</label>
            <select
              id="compare-role"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full p-2 bg-bg-input border border-border rounded-sm text-sm text-text-primary focus:border-primary outline-none cursor-pointer"
            >
              {rolesList.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-8 my-4 max-lg:grid-cols-1">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary">Resume Draft A</label>
              <textarea
                placeholder="Paste the plain text of Resume version A here..."
                value={resumeA}
                onChange={(e) => setResumeA(e.target.value)}
                rows="6"
                className="w-full p-3 bg-bg-input border border-border rounded-sm text-sm text-text-primary focus:border-primary outline-none font-sans"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary">Resume Draft B</label>
              <textarea
                placeholder="Paste the plain text of Resume version B here..."
                value={resumeB}
                onChange={(e) => setResumeB(e.target.value)}
                rows="6"
                className="w-full p-3 bg-bg-input border border-border rounded-sm text-sm text-text-primary focus:border-primary outline-none font-sans"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary self-start" disabled={isComparing}>
            {isComparing ? 'Running Overlap Scan...' : 'Compare Resumes'}
          </button>
        </form>

        {isComparing && (
          <div className="mt-8 text-center flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <p className="text-sm text-text-secondary m-0">Analyzing keyword density and matching index scores...</p>
          </div>
        )}

        {compResults && !isComparing && (
          <div className="mt-8 border-t border-border pt-8 animate-[fadeIn_0.5s_ease-out_forwards]">
            <h4 className="text-lg font-bold mb-6">Comparison Results for: {compResults.role}</h4>
            
            <div className="grid grid-cols-2 gap-8 mb-6 max-lg:grid-cols-1">
              {/* Resume A Column */}
              <div className="p-6 bg-bg-secondary border border-border rounded-md flex flex-col gap-4">
                <div className="flex justify-between items-center w-full">
                  <h4 className="text-base font-bold m-0">Resume Draft A</h4>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                    compResults.resA.score >= 7 
                      ? 'bg-success-bg text-success border-success-border' 
                      : 'bg-warning-bg text-warning border-warning-border'
                  }`}>
                    {Math.round(compResults.resA.score * 10)}% match
                  </span>
                </div>
                
                <div className="mt-2">
                  <h5 className="text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-2">Matched Skills ({compResults.resA.matched.length})</h5>
                  <div className="flex flex-wrap gap-1.5">
                    {compResults.resA.matched.map(s => (
                      <span key={s} className="bg-success-bg text-success border border-success-border px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase">{s}</span>
                    ))}
                  </div>
                </div>

                <div className="mt-2">
                  <h5 className="text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-2">Missing Gaps ({compResults.resA.missing.length})</h5>
                  <div className="flex flex-wrap gap-1.5">
                    {compResults.resA.missing.map(s => (
                      <span key={s} className="bg-error-bg text-error border border-error-border px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase">{s}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Resume B Column */}
              <div className="p-6 bg-bg-secondary border border-border rounded-md flex flex-col gap-4">
                <div className="flex justify-between items-center w-full">
                  <h4 className="text-base font-bold m-0">Resume Draft B</h4>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                    compResults.resB.score >= 7 
                      ? 'bg-success-bg text-success border-success-border' 
                      : 'bg-warning-bg text-warning border-warning-border'
                  }`}>
                    {Math.round(compResults.resB.score * 10)}% match
                  </span>
                </div>

                <div className="mt-2">
                  <h5 className="text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-2">Matched Skills ({compResults.resB.matched.length})</h5>
                  <div className="flex flex-wrap gap-1.5">
                    {compResults.resB.matched.map(s => (
                      <span key={s} className="bg-success-bg text-success border border-success-border px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase">{s}</span>
                    ))}
                  </div>
                </div>

                <div className="mt-2">
                  <h5 className="text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-2">Missing Gaps ({compResults.resB.missing.length})</h5>
                  <div className="flex flex-wrap gap-1.5">
                    {compResults.resB.missing.map(s => (
                      <span key={s} className="bg-error-bg text-error border border-error-border px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-bg-secondary border border-border border-l-4 border-l-[#3b82f6] rounded-md flex items-center justify-center gap-4 text-sm text-text-primary">
              <span className="text-xl">💡</span>
              <p className="m-0 text-left">
                <strong>Verdict: </strong> 
                {compResults.resA.score > compResults.resB.score 
                  ? 'Draft A is more highly optimized for this role due to higher keyword matches.' 
                  : compResults.resB.score > compResults.resA.score
                  ? 'Draft B contains better keyword integration and has a higher compatibility rating.'
                  : 'Both drafts score identically. Try adding more missing skills to stand out.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
