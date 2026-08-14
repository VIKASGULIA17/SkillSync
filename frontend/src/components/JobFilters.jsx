import { useState, useEffect } from 'react';
import { getRoles } from '../api/client';

export default function JobFilters({ onFilterChange, initialFilters }) {
  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState(initialFilters.search || '');
  const [category, setCategory] = useState(initialFilters.category || '');
  const [experience, setExperience] = useState(initialFilters.experience || '');
  const [platform, setPlatform] = useState(initialFilters.platform || '');

  useEffect(() => {
    async function loadRoles() {
      try {
        const data = await getRoles();
        setRoles(data.roles || []);
      } catch (err) {
        console.error('Failed to load roles for filter:', err);
      }
    }
    loadRoles();
  }, []);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    onFilterChange({ search: e.target.value, category, experience, platform });
  };

  const handleCategoryChange = (e) => {
    const value = e.target.value === '--All Categories--' ? '' : e.target.value;
    setCategory(value);
    onFilterChange({ search, category: value, experience, platform });
  };

  const handleExperienceChange = (e) => {
    const value = e.target.value === '--All Experience--' ? '' : e.target.value;
    setExperience(value);
    onFilterChange({ search, category, experience: value, platform });
  };

  const handlePlatformChange = (e) => {
    const value = e.target.value === '--All Platforms--' ? '' : e.target.value;
    setPlatform(value);
    onFilterChange({ search, category, experience, platform: value });
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setExperience('');
    setPlatform('');
    onFilterChange({ search: '', category: '', experience: '', platform: '' });
  };

  const experienceOptions = [
    'Fresher',
    '1 year(s)',
    '2 year(s)',
    '3 year(s)',
    '4 year(s)',
    '5 year(s)',
  ];

  return (
    <div className="flex flex-col gap-4 p-6 bg-bg-secondary border border-border rounded-md mb-6 transition-all duration-650 animate-slide-up stagger-1">
      <div className="relative w-full flex items-center group">
        <span className="absolute left-4 flex items-center text-text-tertiary pointer-events-none transition-colors duration-650 group-focus-within:text-primary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </span>
        <input
          id="search-filter"
          type="text"
          placeholder="Search jobs by title, company, or keywords..."
          value={search}
          onChange={handleSearchChange}
          className="py-3 pl-11 pr-4 text-base rounded-sm border border-border bg-bg-input w-full text-text-primary transition-all duration-650 outline-none focus:border-primary focus:bg-bg-input-focus"
        />
      </div>

      <div className="flex flex-wrap gap-4 items-center w-full max-sm:flex-col max-sm:items-stretch">
        <div className="flex items-center bg-bg-input border border-border rounded-sm relative transition-all duration-650 min-w-45 grow focus-within:border-primary hover:border-border-hover max-sm:w-full">
          <span className="absolute left-3.5 flex items-center text-text-tertiary pointer-events-none transition-colors duration-650 group-focus-within:text-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
              <line x1="4" x2="4" y1="22" y2="15" />
            </svg>
          </span>
          <select
            id="category-filter"
            value={category || '--All Categories--'}
            onChange={handleCategoryChange}
            className="bg-transparent border-none py-2 pl-9 pr-8 outline-none cursor-pointer text-text-secondary text-sm font-medium w-full transition-colors duration-300 hover:text-text-primary appearance-none bg-[url('data:image/svg+xml,%3Csvg_xmlns=%22http://www.w3.org/2000/svg%22_width=%2210%22_height=%2210%22_fill=%22%23707070%22_viewBox=%220_0_16_16%22%3E%3Cpath_d=%22M8_11L3_6h10l-5_5z%22/%3E%3C/svg%3E')] bg-[no-repeat] bg-[right_12px_center]"
            aria-label="Filter Category"
          >
            <option className="bg-bg-secondary text-text-primary">--All Categories--</option>
            {roles.map((role) => (
              <option key={role} value={role} className="bg-bg-secondary text-text-primary">{role}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center bg-bg-input border border-border rounded-sm relative transition-all duration-650 min-w-[180px] grow focus-within:border-primary hover:border-border-hover max-sm:w-full">
          <span className="absolute left-3.5 flex items-center text-text-tertiary pointer-events-none transition-colors duration-650 group-focus-within:text-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </span>
          <select
            id="experience-filter"
            value={experience || '--All Experience--'}
            onChange={handleExperienceChange}
            className="bg-transparent border-none py-2 pl-9 pr-8 outline-none cursor-pointer text-text-secondary text-sm font-medium w-full transition-colors duration-300 hover:text-text-primary appearance-none bg-[url('data:image/svg+xml,%3Csvg_xmlns=%22http://www.w3.org/2000/svg%22_width=%2210%22_height=%2210%22_fill=%22%23707070%22_viewBox=%220_0_16_16%22%3E%3Cpath_d=%22M8_11L3_6h10l-5_5z%22/%3E%3C/svg%3E')] bg-[no-repeat] bg-[right_12px_center]"
            aria-label="Filter Experience"
          >
            <option className="bg-bg-secondary text-text-primary">--All Experience--</option>
            {experienceOptions.map((exp) => (
              <option key={exp} value={exp} className="bg-bg-secondary text-text-primary">{exp}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center bg-bg-input border border-border rounded-sm relative transition-all duration-650 min-w-[180px] grow focus-within:border-primary hover:border-border-hover max-sm:w-full">
          <span className="absolute left-3.5 flex items-center text-text-tertiary pointer-events-none transition-colors duration-650 group-focus-within:text-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="14" x="2" y="3" rx="2" ry="2" />
              <line x1="8" x2="16" y1="21" y2="21" />
              <line x1="12" x2="12" y1="17" y2="21" />
            </svg>
          </span>
          <select
            id="platform-filter"
            value={platform || '--All Platforms--'}
            onChange={handlePlatformChange}
            className="bg-transparent border-none py-2 pl-9 pr-8 outline-none cursor-pointer text-text-secondary text-sm font-medium w-full transition-colors duration-300 hover:text-text-primary appearance-none bg-[url('data:image/svg+xml,%3Csvg_xmlns=%22http://www.w3.org/2000/svg%22_width=%2210%22_height=%2210%22_fill=%22%23707070%22_viewBox=%220_0_16_16%22%3E%3Cpath_d=%22M8_11L3_6h10l-5_5z%22/%3E%3C/svg%3E')] bg-[no-repeat] bg-[right_12px_center]"
            aria-label="Filter Platform"
          >
            <option className="bg-bg-secondary text-text-primary">--All Platforms--</option>
            <option value="Internshala" className="bg-bg-secondary text-text-primary">Internshala</option>
            <option value="FreshersWorld" className="bg-bg-secondary text-text-primary">FreshersWorld</option>
          </select>
        </div>

        {(search || category || experience || platform) && (
          <button
            className="text-xs text-text-tertiary hover:text-text-primary py-1.5 px-3 max-md:w-full max-md:ml-0 max-md:text-center btn btn-ghost ml-auto"
            onClick={clearFilters}
          >
            Clear Filters ✕
          </button>
        )}
      </div>
    </div>
  );
}
