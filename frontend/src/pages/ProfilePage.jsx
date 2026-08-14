import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import {
  getUserProfile,
  updatePersonalInfo,
  updateSkillSet,
  getSavedJobs,
  unsaveJob,
  getApiKeyStatus,
  setApiKey,
  analyzeResume,
  saveAnalysisToHistory,
} from '../api/client.js';

export default function ProfilePage() {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const resumeInputRef = useRef(null);

  // States
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [loading, setLoading] = useState(true);

  // API Key (Settings) states
  const [apiKey, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [savingKey, setSavingKey] = useState(false);

  // Profile field states
  const [fullName, setFullName] = useState('');
  const [headline, setHeadline] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');

  // Social links
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [portfolio, setPortfolio] = useState('');

  // Stats & Saved Jobs
  const [stats, setStats] = useState({ avgScore: 0, resumesUploaded: 0, savedJobsCount: 0 });
  const [savedJobs, setSavedJobs] = useState([]);

  // Resume Upload State
  const [parsingResume, setParsingResume] = useState(false);
  const [parseStep, setParseStep] = useState('');
  const [parsedFileName, setParsedFileName] = useState('');

  // Load profile data from backend API
  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      try {
        setLoading(true);
        const profileData = await getUserProfile();

        setFullName(profileData.full_name || user.full_name || '');
        setHeadline(profileData.target_role || 'Software Developer');
        setLocation(profileData.location || '');
        setBio(profileData.description || '');
        setGithub(profileData.github || '');
        setLinkedin(profileData.linkedin || '');
        setPortfolio(profileData.portfolio || '');

        // Parse skill_matrix if it's a JSON string
        let skillsList = [];
        if (profileData.skill_matrix) {
          try {
            skillsList = typeof profileData.skill_matrix === 'string'
              ? JSON.parse(profileData.skill_matrix)
              : profileData.skill_matrix;
          } catch (e) {
            console.error('Failed to parse skill_matrix', e);
            skillsList = [];
          }
        }
        setSkills(Array.isArray(skillsList) ? skillsList : []);

        // Load saved jobs from backend first
        let savedJobsCount = 0;
        try {
          const savedData = await getSavedJobs();
          console.log('Saved jobs data:', savedData); // Debug log
          const jobs = (savedData || []).map(s => ({
            id: s.id,
            title: s.job.title,
            company: s.job.company,
            location: s.job.location,
            category: s.job.category,
            salary: s.job.salary,
            url: s.job.link,
          }));
          setSavedJobs(jobs);
          savedJobsCount = jobs.length;
        } catch (savedErr) {
          console.error('Failed to load saved jobs:', {
            error: savedErr,
            message: savedErr.message,
            stack: savedErr.stack,
            hasToken: !!localStorage.getItem('token')
          });
          setSavedJobs([]);
        }

        // Set stats with actual saved jobs count
        const avgScore = Math.round((profileData.match_score || 0) * 10);
        console.log('Profile stats:', { // Debug log
          avgScore,
          resumesUploaded: profileData.resume_analysed || 0,
          savedJobsCount
        });

        setStats({
          avgScore: avgScore,
          resumesUploaded: profileData.resume_analysed || 0,
          savedJobsCount: savedJobsCount
        });

        // Load API key status
        try {
          const keyStatus = await getApiKeyStatus();
          setIsConfigured(keyStatus.configured || false);
        } catch (keyErr) {
          console.error('Failed to load API key status:', keyErr);
          setIsConfigured(false);
        }

      } catch (err) {
        console.error('Failed to load profile:', err);
        setError(err.message || 'Failed to load profile data');

        // Set defaults on error
        setFullName(user.full_name || '');
        setHeadline('Software Developer');
        setLocation('');
        setBio('');
        setSkills([]);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  // Handle Form Submit
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!fullName.trim()) {
      setError("Name cannot be empty.");
      return;
    }

    try {
      const updates = {
        full_name: fullName,
        target_role: headline,
        location: location,
        description: bio,
        github: github,
        linkedin: linkedin,
        portfolio: portfolio
      };

      await updatePersonalInfo(updates);
      setSuccessMsg("Profile information saved successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err.message || "Failed to save changes.");
    }
  };

  // Handle Avatar Upload
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError("Please upload an image file.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Image size should be less than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target.result;
      setAvatar(base64Data);
      setSuccessMsg("Profile picture updated!");
      setTimeout(() => setSuccessMsg(null), 3000);
    };
    reader.onerror = () => {
      setError("Failed to read image file.");
    };
    reader.readAsDataURL(file);
  };

  // Trigger file upload dialog for Avatar
  const triggerAvatarUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Add a new skill
  const handleAddSkill = async (e) => {
    e.preventDefault();
    const cleanSkill = newSkill.trim();
    if (!cleanSkill) return;

    if (skills.some(s => s.toLowerCase() === cleanSkill.toLowerCase())) {
      setError("Skill already exists in your profile.");
      setNewSkill('');
      setTimeout(() => setError(null), 3000);
      return;
    }

    const updatedSkills = [...skills, cleanSkill];
    setSkills(updatedSkills);
    setNewSkill('');

    try {
      await updateSkillSet(updatedSkills);
      setSuccessMsg("Skill added successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err.message || "Failed to update skills.");
      setSkills(skills);
    }
  };

  // Delete a skill tag
  const handleDeleteSkill = async (skillToDelete) => {
    const updatedSkills = skills.filter(s => s !== skillToDelete);
    setSkills(updatedSkills);

    try {
      await updateSkillSet(updatedSkills);
    } catch (err) {
      setError(err.message || "Failed to remove skill.");
      setSkills(skills);
    }
  };

  // Remove saved job
  const handleRemoveJob = async (jobId) => {
    try {
      await unsaveJob(jobId);
      const updatedJobs = savedJobs.filter(j => j.id !== jobId);
      setSavedJobs(updatedJobs);
      setStats(prev => ({ ...prev, savedJobsCount: updatedJobs.length }));
    } catch (err) {
      setError(err.message || 'Failed to remove saved job.');
    }
  };

  // Save / validate the Groq API key (Settings)
  const handleApiKeySubmit = async (e) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setError('API key cannot be empty.');
      return;
    }

    setSavingKey(true);
    setError(null);

    try {
      const result = await setApiKey(apiKey.trim());
      if (result.valid) {
        setIsConfigured(true);
        setSuccessMsg('Groq API Key configured and validated successfully!');
        setApiKeyInput('');
      } else {
        setError(result.message || 'API key validation failed. Please check the key.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while validating the API key.');
    } finally {
      setSavingKey(false);
    }
  };

  // Upload resume and parse it via the real analysis API
  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setParsedFileName(file.name);
    setParsingResume(true);
    setParseStep('Uploading document securely...');
    setError(null);

    try {
      setParseStep('Parsing text contents and extracting skills...');
      const result = await analyzeResume(file);

      // Save analysis to history to update backend stats
      try {
        await saveAnalysisToHistory({
          role: result.best_role,
          score: result.score,
          matched_skills: result.matched_skills,
          missing_skills: result.missing_skills,
          resume_filename: file.name
        });
      } catch (historyErr) {
        console.error('Failed to save analysis to history:', historyErr);
      }

      // Combine parsed skills with existing, filtering duplicates
      const newSkillsList = [...skills];
      (result.matched_skills || []).forEach(skill => {
        if (!newSkillsList.some(s => s.toLowerCase() === skill.toLowerCase())) {
          newSkillsList.push(skill);
        }
      });

      setHeadline(result.best_role || headline);
      setSkills(newSkillsList);

      // Persist updated skills + target role to backend
      try {
        await updateSkillSet(newSkillsList);
        await updatePersonalInfo({ target_role: result.best_role || headline });
      } catch (saveErr) {
        console.error('Failed to persist parsed skills:', saveErr);
      }

      setStats(prev => ({
        ...prev,
        avgScore: Math.round((result.score || 0) * 10),
        resumesUploaded: prev.resumesUploaded + 1,
      }));

      setSuccessMsg(`Resume "${file.name}" parsed! Match score ${Math.round((result.score || 0) * 10)}% for ${result.best_role}.`);
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err) {
      setError(err.message || 'Failed to parse resume.');
    } finally {
      setParsingResume(false);
      setParseStep('');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-text-secondary text-sm">Loading profile...</span>
        </div>
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

      {/* Hero Header Section */}
      <div className="relative p-8 bg-bg-secondary border border-border rounded-md overflow-hidden animate-[scaleIn_0.85s_cubic-bezier(0.22,1,0.36,1)_forwards]">
        {/* Glow visual background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(62,207,142,0.08)_0%,transparent_60%)] pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-primary to-secondary" />

        <div className="flex max-md:flex-col items-center gap-8 relative z-10">
          
          {/* Avatar Upload Container */}
          <div className="relative group cursor-pointer" onClick={triggerAvatarUpload} title="Click to upload profile photo">
            <div className="w-28 h-28 rounded-full border-2 border-border overflow-hidden bg-bg-tertiary flex items-center justify-center transition-all duration-300 group-hover:border-primary group-hover:shadow-[0_0_15px_rgba(62,207,142,0.2)]">
              {avatar ? (
                <img src={avatar} alt="Profile Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="text-4xl font-extrabold text-primary select-none">
                  {fullName ? fullName[0].toUpperCase() : 'U'}
                </div>
              )}
            </div>
            
            <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="text-[10px] text-white font-bold uppercase tracking-wider">Change</span>
              <span className="text-base">📸</span>
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleAvatarChange} 
              accept="image/*" 
              className="hidden" 
            />
          </div>

          {/* User Details */}
          <div className="flex-1 max-md:text-center">
            <h1 className="text-3xl font-extrabold font-headings text-text-primary tracking-tight mb-1">
              {fullName || 'User Profile'}
            </h1>
            <p className="text-primary font-semibold text-sm mb-3 tracking-wide">{headline}</p>
            
            <div className="flex max-md:justify-center items-center gap-2 text-text-secondary text-xs mb-4">
              <span>📍</span>
              <span>{location}</span>
              <span className="text-border">|</span>
              <span>✉️</span>
              <span>{user?.email || 'user@example.com'}</span>
            </div>

            {/* Social Icons */}
            <div className="flex max-md:justify-center gap-3">
              {github && (
                <a href={github} target="_blank" rel="noopener noreferrer" className="p-2 rounded-sm bg-bg-tertiary border border-border text-text-secondary hover:text-text-primary hover:border-border-hover transition-all duration-300 text-xs flex items-center gap-1.5 no-underline">
                  <span>💻</span> GitHub
                </a>
              )}
              {linkedin && (
                <a href={linkedin} target="_blank" rel="noopener noreferrer" className="p-2 rounded-sm bg-bg-tertiary border border-border text-text-secondary hover:text-text-primary hover:border-border-hover transition-all duration-300 text-xs flex items-center gap-1.5 no-underline">
                  <span>👔</span> LinkedIn
                </a>
              )}
              {portfolio && (
                <a href={portfolio} target="_blank" rel="noopener noreferrer" className="p-2 rounded-sm bg-bg-tertiary border border-border text-text-secondary hover:text-text-primary hover:border-border-hover transition-all duration-300 text-xs flex items-center gap-1.5 no-underline">
                  <span>🌐</span> Portfolio
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Quick-info Cards */}
      <div className="grid grid-cols-3 gap-6 max-md:grid-cols-1 stagger-1">
        <div className="p-6 bg-bg-secondary border border-border rounded-md flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 left-0 bottom-0 w-[3px] bg-primary group-hover:h-full transition-all" />
          <span className="text-xs text-text-secondary font-semibold uppercase tracking-wider mb-2">Average Match Score</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-primary font-headings">{stats.avgScore}%</span>
            <span className="text-xs text-success-border font-medium">✓ Industry Ready</span>
          </div>
        </div>

        <div className="p-6 bg-bg-secondary border border-border rounded-md flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 left-0 bottom-0 w-[3px] bg-info group-hover:h-full transition-all" />
          <span className="text-xs text-text-secondary font-semibold uppercase tracking-wider mb-2">Resumes Analyzed</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-text-primary font-headings">{stats.resumesUploaded}</span>
            <span className="text-xs text-text-secondary font-medium">Versions Saved</span>
          </div>
        </div>

        <div className="p-6 bg-bg-secondary border border-border rounded-md flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 left-0 bottom-0 w-[3px] bg-warning group-hover:h-full transition-all" />
          <span className="text-xs text-text-secondary font-semibold uppercase tracking-wider mb-2">Saved Openings</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-text-primary font-headings">{stats.savedJobsCount}</span>
            <span className="text-xs text-text-secondary font-medium">Active Applications</span>
          </div>
        </div>
      </div>

      {/* Layout Split */}
      <div className="grid grid-cols-[2fr_1.2fr] gap-8 max-lg:grid-cols-1">
        
        {/* Left Hand side: Form & Saved Jobs */}
        <div className="flex flex-col gap-8">
          
          {/* Edit Profile Form */}
          <div className="p-8 bg-bg-secondary border border-border rounded-md stagger-2">
            <h2 className="text-xl font-bold font-headings text-text-primary border-b border-border pb-4 mb-6">
              Account Profile Settings
            </h2>

            <form onSubmit={handleSaveProfile} className="flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <div className="flex flex-col gap-2">
                  <label htmlFor="name-input" className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Full Name
                  </label>
                  <input
                    id="name-input"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your name"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="email-input" className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Email Address
                  </label>
                  <input
                    id="email-input"
                    type="email"
                    value={user?.email || 'user@example.com'}
                    disabled
                    className="bg-bg-tertiary cursor-not-allowed opacity-80"
                    title="Account email address cannot be changed."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <div className="flex flex-col gap-2">
                  <label htmlFor="headline-input" className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Headline / Target Role
                  </label>
                  <input
                    id="headline-input"
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g. Lead Frontend Engineer"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="location-input" className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Location
                  </label>
                  <input
                    id="location-input"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Bengaluru, India"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="bio-input" className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Professional Bio / Summary
                </label>
                <textarea
                  id="bio-input"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows="4"
                  className="resize-none"
                />
              </div>

              {/* Social links Inputs */}
              <div className="border-t border-border pt-6 flex flex-col gap-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">Social Profiles</h3>
                
                <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="github-input" className="text-[11px] font-semibold text-text-secondary">GitHub URL</label>
                    <input
                      id="github-input"
                      type="url"
                      value={github}
                      onChange={(e) => setGithub(e.target.value)}
                      placeholder="https://github.com/..."
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="linkedin-input" className="text-[11px] font-semibold text-text-secondary">LinkedIn URL</label>
                    <input
                      id="linkedin-input"
                      type="url"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="portfolio-input" className="text-[11px] font-semibold text-text-secondary">Portfolio URL</label>
                    <input
                      id="portfolio-input"
                      type="url"
                      value={portfolio}
                      onChange={(e) => setPortfolio(e.target.value)}
                      placeholder="https://mywebsite.com"
                    />
                  </div>
                </div>
              </div>

              <button type="submit" className="btn btn-primary self-start mt-2">
                Save Profile Changes
              </button>
            </form>
          </div>

          {/* Saved Jobs Board List */}
          <div className="p-8 bg-bg-secondary border border-border rounded-md stagger-3">
            <div className="flex justify-between items-center border-b border-border pb-4 mb-6">
              <h2 className="text-xl font-bold font-headings text-text-primary">
                Saved Careers & Jobs
              </h2>
              <span className="badge badge-info">{savedJobs.length} Saved</span>
            </div>

            {savedJobs.length > 0 ? (
              <div className="flex flex-col gap-4">
                {savedJobs.map((job) => (
                  <div key={job.id} className="p-5 bg-bg-tertiary border border-border rounded-sm hover:border-primary/45 hover:shadow-lg transition-all duration-300 flex justify-between items-center max-sm:flex-col max-sm:items-start max-sm:gap-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-text-primary text-base m-0">{job.title}</h4>
                        <span className="badge badge-success text-[10px] py-0.5">{job.category}</span>
                      </div>
                      <p className="text-xs text-text-secondary font-semibold m-0">{job.company} • <span className="font-normal text-text-tertiary">{job.location}</span></p>
                      <p className="text-[11px] text-primary m-0 font-medium">{job.salary}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary btn-sm no-underline"
                      >
                        Apply Now
                      </a>
                      <button
                        onClick={() => handleRemoveJob(job.id)}
                        className="p-2 text-error hover:bg-error-bg rounded-sm border border-transparent hover:border-error-border transition-colors cursor-pointer"
                        title="Remove from saved jobs"
                        aria-label="Remove job"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-bg-tertiary border border-dashed border-border rounded-sm text-text-secondary">
                <span className="text-3xl block mb-2">💼</span>
                <p className="text-sm m-0">You have no saved jobs. Head over to the Jobs Board to explore live matches.</p>
              </div>
            )}
          </div>

          {/* Settings: Groq API Key Configuration */}
          <div className="p-8 bg-bg-secondary border border-border rounded-md stagger-3">
            <div className="flex justify-between items-center border-b border-border pb-4 mb-6">
              <h2 className="text-xl font-bold font-headings text-text-primary">
                ⚙️ AI Integration Settings
              </h2>
              {isConfigured ? (
                <span className="badge badge-success">● API Key Configured</span>
              ) : (
                <span className="badge badge-warning">● API Key Required</span>
              )}
            </div>

            <p className="text-sm text-text-secondary leading-relaxed">
              SkillSync uses the <strong className="text-text-primary">Groq API</strong> to generate
              personalized skill-gap feedback and career study paths.
            </p>

            <form onSubmit={handleApiKeySubmit} className="flex flex-col gap-4 mt-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="api-key-input" className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Enter Groq API Key
                </label>
                <div className="flex gap-4">
                  <input
                    id="api-key-input"
                    type={showKey ? 'text' : 'password'}
                    placeholder={isConfigured ? '••••••••••••••••••••••••••••••••' : 'gsk_...'}
                    value={apiKey}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    disabled={savingKey}
                    className="grow"
                  />
                  <button
                    type="button"
                    className="whitespace-nowrap btn btn-secondary"
                    onClick={() => setShowKey(!showKey)}
                    tabIndex="-1"
                  >
                    {showKey ? 'Hide' : 'Show'}
                  </button>
                </div>
                <p className="text-[11px] text-text-tertiary mt-1">
                  Key is validated directly with Groq on save, and held securely in server memory. It is never stored permanently.
                </p>
              </div>

              <button
                type="submit"
                className="self-start btn btn-primary"
                disabled={savingKey || !apiKey}
              >
                {savingKey ? 'Validating Key...' : 'Test & Save Config'}
              </button>
            </form>
          </div>

        </div>

        {/* Right Hand side: Skills list & Mock Parser */}
        <div className="flex flex-col gap-8 lg:sticky lg:top-[88px] stagger-4">
          
          {/* Skills Management */}
          <div className="p-6 bg-bg-secondary border border-border rounded-md">
            <h3 className="text-lg font-bold font-headings text-text-primary border-b border-border pb-3 mb-4 flex justify-between items-center">
              <span>My Skill Matrix</span>
              <span className="text-xs font-normal text-text-secondary">{skills.length} skills</span>
            </h3>

            {/* Tags wrapper */}
            <div className="flex flex-wrap gap-2 mb-6">
              {skills.map((skill, index) => (
                <span 
                  key={index} 
                  className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-semibold bg-bg-tertiary border border-border text-text-secondary hover:text-text-primary hover:border-primary/40 transition-colors"
                >
                  {skill}
                  <button 
                    type="button" 
                    onClick={() => handleDeleteSkill(skill)}
                    className="w-3.5 h-3.5 rounded-full hover:bg-error-bg hover:text-error flex items-center justify-center text-[9px] border-none p-0 cursor-pointer font-bold leading-none"
                    title={`Remove ${skill}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            {/* Add skill input */}
            <form onSubmit={handleAddSkill} className="flex gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add skill tag..."
                className="grow"
                maxLength="24"
              />
              <button type="submit" className="btn btn-secondary px-4">
                Add
              </button>
            </form>
          </div>

          {/* Resume Parser Simulation Card */}
          <div className="p-6 bg-bg-secondary border border-border rounded-md relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary" />

            <h3 className="text-lg font-bold font-headings text-text-primary mb-2 flex items-center gap-2">
              <span>Smart Resume Sync</span>
              <span className="badge badge-info text-[9px]">Live</span>
            </h3>

            <p className="text-xs text-text-secondary leading-relaxed mb-4">
              Upload a newer resume document to scan credentials, update your target role, and inject matching skills automatically in real-time.
            </p>

            {parsingResume ? (
              <div className="p-6 bg-bg-tertiary border border-border rounded-sm flex flex-col items-center justify-center text-center gap-4 animate-pulse">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wide">AI Analyzer Running</span>
                  <span className="text-[11px] text-text-secondary">{parseStep}</span>
                </div>
                <span className="text-[10px] text-text-tertiary font-mono italic">{parsedFileName}</span>
              </div>
            ) : (
              <div 
                className="p-6 bg-bg-tertiary border border-dashed border-border rounded-sm hover:border-primary/50 transition-all duration-300 flex flex-col items-center justify-center text-center gap-3 cursor-pointer group"
                onClick={() => resumeInputRef.current && resumeInputRef.current.click()}
              >
                <div className="text-3xl group-hover:scale-110 transition-transform">📄</div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-text-primary group-hover:text-primary transition-colors">Select Resume Document</span>
                  <span className="text-[10px] text-text-tertiary">PDF, DOCX, or TXT (Max 5MB)</span>
                </div>
                <input
                  type="file"
                  ref={resumeInputRef}
                  onChange={handleResumeUpload}
                  accept=".pdf,.docx,.doc,.txt"
                  className="hidden"
                />
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
