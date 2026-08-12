import { useState } from 'react';
import { Link } from 'react-router-dom';
import FileUpload from '../components/FileUpload';
import ScoreCard from '../components/ScoreCard';
import SkillChips from '../components/SkillChips';
import RoleSelector from '../components/RoleSelector';
import FeedbackPanel from '../components/FeedbackPanel';
import SkillRadar from '../components/SkillRadar';
import LearningRoadmap from '../components/LearningRoadmap';
import JobCard from '../components/JobCard';
import ErrorBanner from '../components/ErrorBanner';
import LoadingSpinner from '../components/LoadingSpinner';
import { analyzeResume, getAnalysisFeedback, analyzeForRole, getJobs, saveAnalysisToHistory } from '../api/client';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function AnalyzePage() {
  const [file, setFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
  const [error, setError] = useState(null);

  const [analysisResult, setAnalysisResult] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  const handleUpload = async (uploadedFile) => {
    setFile(uploadedFile);
    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);
    setFeedback('');
    setJobs([]);

    try {
      const result = await analyzeResume(uploadedFile);
      setAnalysisResult(result);
      setIsAnalyzing(false);

      // Save analysis to backend history
      try {
        await saveAnalysisToHistory({
          role: result.best_role,
          score: result.score,
          matched_skills: result.matched_skills,
          missing_skills: result.missing_skills,
          resume_filename: uploadedFile.name,
        });
      } catch (e) {
        console.error('Failed to save to history:', e);
      }

      fetchFeedback(result.resume_text, result.best_role, result.missing_skills);
      fetchRecommendedJobs(result.best_role);
    } catch (err) {
      setError(err.message || 'An error occurred during resume analysis. Please try again.');
      setIsAnalyzing(false);
    }
  };

  const fetchFeedback = async (resumeText, role, missingSkills) => {
    setIsFeedbackLoading(true);
    setFeedback('');
    try {
      const data = await getAnalysisFeedback(resumeText, role, missingSkills);
      setFeedback(data.feedback);
    } catch (err) {
      setFeedback(`### AI Feedback Unavailable\n\n${err.message || 'Could not fetch career feedback at this time.'}`);
    } finally {
      setIsFeedbackLoading(false);
    }
  };

  const fetchRecommendedJobs = async (role) => {
    setLoadingJobs(true);
    try {
      const data = await getJobs({ category: role, per_page: 3 });
      if (data.jobs && data.jobs.length > 0) {
        setJobs(data.jobs);
      } else {
        const fallbackData = await getJobs({ per_page: 3 });
        setJobs(fallbackData.jobs || []);
      }
    } catch (err) {
      console.error('Failed to load recommended jobs:', err);
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleRoleChange = async (selectedRole) => {
    if (!analysisResult) return;

    setIsAnalyzing(true);
    setError(null);
    setFeedback('');
    setJobs([]);

    try {
      const result = await analyzeForRole(analysisResult.resume_text, selectedRole);

      const updatedResult = {
        ...analysisResult,
        best_role: result.best_role,
        score: result.score,
        matched_skills: result.matched_skills,
        missing_skills: result.missing_skills
      };

      setAnalysisResult(updatedResult);
      setIsAnalyzing(false);

      // Save analysis to backend history
      try {
        await saveAnalysisToHistory({
          role: result.best_role,
          score: result.score,
          matched_skills: result.matched_skills,
          missing_skills: result.missing_skills,
        });
      } catch (e) {
        console.error('Failed to save to history:', e);
      }

      fetchFeedback(updatedResult.resume_text, selectedRole, updatedResult.missing_skills);
      fetchRecommendedJobs(selectedRole);
    } catch (err) {
      setError(err.message || 'Failed to analyze resume for the selected role.');
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setAnalysisResult(null);
    setFeedback('');
    setJobs([]);
    setError(null);
  };

  const handleDownloadReport = () => {
    if (!analysisResult) return;

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      let yPosition = 20;

      // ============ HEADER ============
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 40, 40);
      doc.text('Resume Assessment Report', margin, yPosition);

      yPosition += 10;
      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text(analysisResult.best_role, margin, yPosition);

      yPosition += 15;

      // ============ COMPATIBILITY SCORE ============
      const scorePercent = Math.round(analysisResult.score * 10);

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 40, 40);
      doc.text('Compatibility Score', margin, yPosition);

      yPosition += 8;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      doc.text(`${scorePercent}%`, margin, yPosition);

      yPosition += 12;

      // ============ OVERALL ASSESSMENT ============
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 40, 40);
      doc.text('Overall Assessment', margin, yPosition);

      yPosition += 8;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);

      const assessmentText = doc.splitTextToSize(
        `The resume demonstrates ${analysisResult.matched_skills.length > 0 ? 'knowledge in ' + analysisResult.matched_skills.slice(0, 3).join(', ') : 'foundational skills'}. ${analysisResult.missing_skills.length > 0 ? 'Key gaps include ' + analysisResult.missing_skills.slice(0, 2).join(' and ') + ', which are important for a ' + analysisResult.best_role + ' position.' : 'Strong alignment with role requirements.'}`,
        pageWidth - margin * 2
      );
      doc.text(assessmentText, margin, yPosition);
      yPosition += (assessmentText.length * 6) + 12;

      // ============ SKILLS YOU HAVE ============
      if (analysisResult.matched_skills.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(40, 40, 40);
        doc.text('Skills You Have', margin, yPosition);
        yPosition += 8;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);

        analysisResult.matched_skills.forEach((skill) => {
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(`• ${skill}`, margin + 5, yPosition);
          yPosition += 6;
        });

        yPosition += 10;
      }

      // ============ SKILLS TO DEVELOP ============
      if (analysisResult.missing_skills.length > 0) {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(40, 40, 40);
        doc.text('Skills to Develop', margin, yPosition);
        yPosition += 8;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);

        analysisResult.missing_skills.forEach((skill) => {
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(`• ${skill}`, margin + 5, yPosition);
          yPosition += 6;
        });

        yPosition += 10;
      }

      // ============ RESUME IMPROVEMENTS ============
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 40, 40);
      doc.text('Resume Improvements', margin, yPosition);
      yPosition += 8;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);

      const improvements = [
        'Use a standard resume structure',
        'Highlight practical projects and experience',
        'Mention specific tools and technologies',
        'Quantify achievements with measurable results',
        'Tailor the resume to the job description'
      ];

      improvements.forEach((item) => {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(`• ${item}`, margin + 5, yPosition);
        yPosition += 6;
      });

      yPosition += 10;

      // ============ CAREER DEVELOPMENT ============
      if (yPosition > pageHeight - 50) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 40, 40);
      doc.text('Career Development Tips', margin, yPosition);
      yPosition += 8;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);

      const careerTips = [
        'Build 2-3 practical projects showcasing key skills',
        'Create a strong LinkedIn and GitHub presence',
        'Pursue relevant certifications',
        'Improve communication and system-design skills',
        'Network with professionals in your target role'
      ];

      careerTips.forEach((tip) => {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(`• ${tip}`, margin + 5, yPosition);
        yPosition += 6;
      });

      yPosition += 10;

      // ============ RECOMMENDATIONS ============
      if (yPosition > pageHeight - 50) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 40, 40);
      doc.text('Next Steps', margin, yPosition);
      yPosition += 8;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);

      const recommendations = [
        'Focus on acquiring the missing skills through online courses and practice projects',
        'Update your resume with any new skills, certifications, or relevant projects',
        'Tailor your experience section to highlight skills matching the target role',
        'Prepare for technical interviews by practicing common questions for this position'
      ];

      recommendations.forEach((rec) => {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(`• ${rec}`, margin + 5, yPosition);
        yPosition += 6;
      });

      // ============ FOOTER ON ALL PAGES ============
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        const footerY = pageHeight - 10;

        doc.setFontSize(9);
        doc.setTextColor(130, 130, 130);
        doc.setFont('helvetica', 'normal');
        doc.text('Generated by SkillSync', pageWidth / 2, footerY, { align: 'center' });

        doc.setFontSize(8);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, footerY, { align: 'right' });
      }

      // Save PDF
      const fileName = `SkillSync_${analysisResult.best_role.replace(/\s+/g, '_')}_Report.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('Failed to generate PDF report. Please try again.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen page-wrapper mx-auto max-w-[1200px] w-full px-6 md:px-8">
      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

      {!analysisResult && !isAnalyzing && (
        <div className="text-center max-w-[760px] mx-auto mt-16 flex flex-col items-center gap-6 animate-[slideUp_0.95s_cubic-bezier(0.22,1,0.36,1)_forwards]">
          <h1 className="text-5xl max-sm:text-4xl max-xs:text-3xl font-extrabold tracking-tight leading-[1.15] text-text-primary">
            Analyze Your <span className="text-primary">Resume</span>
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed max-w-[60ch] m-0">
            Upload your resume document (PDF, DOCX, DOC, or TXT) to instantly calculate your compatibility score, identify missing skills, and get personalized career guidance.
          </p>

          <div className="w-full max-w-[540px] mt-8">
            <FileUpload onAnalyze={handleUpload} isAnalyzing={isAnalyzing} />
          </div>
        </div>
      )}

      {isAnalyzing && (
        <div className="flex justify-center items-center mt-16 min-h-[300px] animate-[fadeIn_0.8s_cubic-bezier(0.22,1,0.36,1)_forwards]">
          <LoadingSpinner text="Analyzing your resume. Scanning skill databases and matching roles..." />
        </div>
      )}

      {analysisResult && !isAnalyzing && (
        <div className="flex flex-col gap-6 mt-4 animate-[fadeIn_0.8s_cubic-bezier(0.22,1,0.36,1)_forwards]">
          <div className="flex justify-between items-center border-b border-border pb-4 max-sm:flex-col max-sm:items-start max-sm:gap-4">
            <div>
              <h2 className="text-2xl font-bold font-headings">Analysis Report</h2>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-text-secondary text-sm mt-0.5">
                <span>Source: <strong className="text-text-primary">{file?.name || 'Document'}</strong></span>
                <span className="text-border max-sm:hidden">|</span>
                <span>Role detected: <strong className="text-text-primary">{analysisResult.best_role}</strong></span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-primary btn-sm" onClick={handleDownloadReport}>
                Download Report 📥
              </button>
              <button className="btn btn-secondary btn-sm" onClick={handleReset}>
                Upload Another Resume ↺
              </button>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_1.8fr] gap-6 items-start max-lg:grid-cols-1">
            {/* Left Column: Score, Selector, Skills */}
            <div className="flex flex-col gap-6 lg:sticky lg:top-[88px]">
              <div className="p-6 flex flex-col items-center text-center gap-6 bg-bg-secondary border border-border rounded-md">
                <ScoreCard score={analysisResult.score} roleName={analysisResult.best_role} />

                <div className="w-full border-t border-border pt-6 flex flex-col gap-1 text-left">
                  <p className="text-[11px] text-text-secondary font-medium mb-2">Not targeting this role?</p>
                  <RoleSelector
                    currentRole={analysisResult.best_role}
                    rolesScores={analysisResult.all_roles_scores || []}
                    onRoleChange={handleRoleChange}
                  />
                </div>
              </div>

              <SkillRadar
                matchedSkills={analysisResult.matched_skills}
                missingSkills={analysisResult.missing_skills}
              />

              <SkillChips
                matchedSkills={analysisResult.matched_skills}
                missingSkills={analysisResult.missing_skills}
              />
            </div>

            {/* Right Column: AI Guidance & Jobs */}
            <div className="flex flex-col gap-12">
              <FeedbackPanel feedback={feedback} isLoading={isFeedbackLoading} />

              <LearningRoadmap missingSkills={analysisResult.missing_skills} />

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold font-headings">Recommended Jobs</h3>
                  <Link to="/jobs" className="text-sm font-semibold text-primary hover:text-primary-hover transition-colors duration-300">
                    View All Jobs →
                  </Link>
                </div>

                {loadingJobs ? (
                  <LoadingSpinner text="Finding top match job openings..." />
                ) : jobs.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {jobs.map((job, idx) => (
                      <JobCard key={idx} job={job} />
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-text-secondary flex flex-col items-center gap-4 bg-bg-secondary border border-border rounded-md">
                    <p className="m-0">No immediate jobs matching this role. Check our jobs board for options.</p>
                    <Link to="/jobs" className="btn btn-secondary btn-sm">Browse All Openings</Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
