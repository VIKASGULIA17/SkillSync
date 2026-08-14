import { useState, useEffect } from 'react';
import { createJobApplication, getJobApplications, updateJobApplication, deleteJobApplication } from '../api/client';

export default function JobCard({ job }) {
  const {
    title,
    company,
    location,
    salary,
    experience,
    link,
    platform,
    id,
  } = job;

  const [status, setStatus] = useState('');
  const [isTracking, setIsTracking] = useState(false);

  // Check if this job is already tracked
  useEffect(() => {
    const checkIfTracked = async () => {
      try {
        const existingApps = await getJobApplications();
        const isThisJobTracked = existingApps.some(
          app => app.title === title && app.company === company
        );
        if (isThisJobTracked) {
          // Find the status and set it
          const trackedApp = existingApps.find(
            app => app.title === title && app.company === company
          );
          if (trackedApp) {
            setStatus(trackedApp.status);
          }
        }
      } catch (err) {
        console.error('Failed to check if job is tracked:', err);
      }
    };
    checkIfTracked();
  }, [title, company]);

  const handleStatusChange = async (newStatus) => {
    if (!newStatus) {
      setStatus('');
      return;
    }

    setIsTracking(true);

    try {
      // Check for duplicates before creating
      const existingApps = await getJobApplications();
      const isDuplicate = existingApps.some(
        app => app.title === title && app.company === company
      );

      if (isDuplicate) {
        alert('This job is already tracked in your applications.');
        setIsTracking(false);
        return;
      }

      // Create job application in database
      await createJobApplication({
        title,
        company,
        location: location || '',
        salary: salary || '',
        link,
        platform,
        status: newStatus,
      });

      // Update local status to reflect the new tracking status
      setStatus(newStatus);

      // Trigger a reload of job applications in the JobsPage to sync the UI
      if (typeof window.refreshJobApplications === 'function') {
        window.refreshJobApplications();
      }
    } catch (err) {
      console.error('Failed to track job:', err);
      alert('Failed to track job. Please try again.');
    } finally {
      setIsTracking(false);
    }
  };

  const isInternshala = platform?.toLowerCase() === 'internshala';
  const platformClass = isInternshala 
    ? 'bg-info/10 text-info border-info/20' 
    : 'bg-warning/10 text-warning border-warning/20';

  return (
    <div className="flex flex-col h-full p-6 bg-bg-secondary border border-border rounded-md relative overflow-hidden transition-all duration-650 hover:border-primary hover:bg-bg-card-hover animate-[scaleIn_0.85s_cubic-bezier(0.22,1,0.36,1)_forwards]">
      <div className="flex justify-between items-start gap-4 mb-4">
        <h4 className="font-headings text-base font-bold text-text-primary m-0 line-clamp-2 h-[2.6em] leading-snug grow" title={title}>
          {title}
        </h4>
        <span className={`shrink-0 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${platformClass}`}>
          {platform}
        </span>
      </div>
      
      <div className="grow flex flex-col gap-1 mb-6">
        <p className="text-text-secondary m-0 text-sm">
          <span className="font-semibold text-text-primary">Company: </span> {company}
        </p>
        <p className="text-text-secondary text-sm m-0">
          <span className="font-semibold text-text-primary">Location: </span> {location || 'Remote / Not specified'}
        </p>
        
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] text-text-tertiary uppercase tracking-wider font-semibold">Salary</span>
            <span className="text-sm text-text-secondary font-medium overflow-hidden text-ellipsis whitespace-nowrap" title={salary || 'Not disclosed'}>
              {salary || 'Not disclosed'}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] text-text-tertiary uppercase tracking-wider font-semibold">Experience</span>
            <span className="text-sm text-text-secondary font-medium overflow-hidden text-ellipsis whitespace-nowrap" title={experience || 'Fresher'}>
              {experience || 'Fresher'}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-auto flex gap-2 w-full">
        <a 
          href={link} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="btn btn-primary text-center grow flex items-center justify-center text-sm gap-1"
        >
          Apply Now
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          disabled={isTracking}
          className="btn btn-secondary text-sm font-sans"
          style={{
            width: 'auto',
            minWidth: '120px',
            cursor: isTracking ? 'wait' : 'pointer',
            outline: 'none',
            padding: '8px 12px',
          }}
          title="Track this job application"
        >
          <option value="">{isTracking ? 'Tracking...' : 'Track Job'}</option>
          <option value="wishlist">Wishlist</option>
          <option value="applied">Applied</option>
          <option value="interviewing">Interview</option>
          <option value="offered">Offered</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
    </div>
  );
}
