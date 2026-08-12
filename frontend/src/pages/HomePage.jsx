import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function HomePage() {
  const [activeFaq, setActiveFaq] = useState(null);

  const faqData = [
    {
      q: "Which file formats are supported?",
      a: "SkillSync supports PDF, DOCX, DOC, and TXT files. You can drop these formats directly into the resume analyzer dashboard."
    },
    {
      q: "Is my resume data secure?",
      a: "Yes. SkillSync processes files temporarily in-memory to extract text for analysis. We do not store your files permanently or share your personal data."
    },
    {
      q: "How does the AI Career Feedback work?",
      a: "We integrate with Groq Cloud LLMs (using Llama 4 instruction models) to compare your qualifications against real-world roles, producing clear, actionable study guidelines."
    },
    {
      q: "Can I apply for jobs directly?",
      a: "Yes, once analyzed, SkillSync fetches job listings matching your target profile from platforms like Internshala and FreshersWorld, with direct application links."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen page-wrapper mx-auto max-w-[1200px] w-full px-6 md:px-8">
      
      {/* Hero Section */}
      <section className="text-center max-w-[800px] mx-auto mt-12 mb-20 flex flex-col items-center gap-6 animate-[slideUp_0.95s_cubic-bezier(0.22,1,0.36,1)_forwards]">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-success-bg border border-success-border rounded-full text-xs font-semibold text-success mb-2">
          ⚡ Powered by Llama 4 AI & Groq Cloud
        </div>
        <h1 className="text-6xl max-md:text-5xl max-sm:text-4xl font-extrabold tracking-tight leading-[1.1] text-text-primary">
          Align Your Skills with the <span className="text-primary">Perfect Job</span>
        </h1>
        <p className="text-lg text-text-secondary leading-relaxed max-w-[62ch] m-0">
          SkillSync parses your resume, compares your qualifications against industry requirements across 50+ tech roles, highlights critical skill gaps, and matches you to live job opportunities.
        </p>
        <div className="flex gap-4 mt-4 max-sm:flex-col max-sm:w-full max-sm:items-center">
          <Link to="/analyze" className="btn btn-primary px-8 py-3.5 text-base shadow-lg shadow-success/15 max-sm:w-full text-center">
            Scan Your Resume Now →
          </Link>
          <Link to="/jobs" className="btn btn-secondary px-8 py-3.5 text-base max-sm:w-full text-center">
            Browse Jobs Board
          </Link>
        </div>
      </section>

      {/* Interactive Mock UI Report Visualizer */}
      <section className="mb-28 max-w-[900px] mx-auto w-full animate-[scaleIn_0.85s_cubic-bezier(0.22,1,0.36,1)_forwards] stagger-1">
        <div className="p-6 bg-bg-secondary border border-border rounded-md relative shadow-2xl overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary"></div>
          
          <div className="flex justify-between items-center border-b border-border pb-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-yellow-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-green-500/80"></span>
              <span className="text-xs text-text-tertiary ml-2 font-mono">vikas_resume_eval.docx</span>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-success-bg text-success border border-success-border">Matched</span>
          </div>

          <div className="grid grid-cols-[1fr_2fr] gap-6 max-sm:grid-cols-1 items-start">
            <div className="p-6 text-center bg-bg-tertiary border border-border rounded-sm flex flex-col items-center">
              <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                {/* SVG circular progress representation */}
                <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                  <circle className="fill-none stroke-border" strokeWidth="8" cx="80" cy="80" r="64" />
                  <circle className="fill-none stroke-primary" strokeWidth="8" strokeLinecap="round" cx="80" cy="80" r="64" strokeDasharray="402" strokeDashoffset="88" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold text-primary leading-none">78%</span>
                  <span className="text-[9px] text-text-tertiary font-semibold uppercase mt-0.5">Match</span>
                </div>
              </div>
              <h4 className="font-bold text-text-primary text-base mb-1">React Developer</h4>
              <p className="text-[11px] text-text-tertiary m-0">Detected matching profile category</p>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <h5 className="text-sm font-semibold uppercase tracking-wider text-text-secondary mb-2">Key Core Skills</h5>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 py-1 px-2.5 rounded-full text-xs font-medium bg-success-bg text-success border border-success-border">✓ React</span>
                  <span className="inline-flex items-center gap-1 py-1 px-2.5 rounded-full text-xs font-medium bg-success-bg text-success border border-success-border">✓ JavaScript</span>
                  <span className="inline-flex items-center gap-1 py-1 px-2.5 rounded-full text-xs font-medium bg-success-bg text-success border border-success-border">✓ Tailwind CSS</span>
                  <span className="inline-flex items-center gap-1 py-1 px-2.5 rounded-full text-xs font-medium bg-error-bg text-error border border-error-border">✕ Redux Toolkit</span>
                  <span className="inline-flex items-center gap-1 py-1 px-2.5 rounded-full text-xs font-medium bg-error-bg text-error border border-error-border">✕ TypeScript</span>
                </div>
              </div>

              <div className="p-4 bg-bg-tertiary rounded-sm border-l-2 border-primary">
                <p className="text-xs text-text-secondary m-0 leading-relaxed">
                  💡 <strong>Career Coach Advice:</strong> You have strong JavaScript foundations and layouts. Adding TypeScript and state-management tools (like Redux Toolkit) will increase your hiring score for Senior React roles by 15%.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid - Skip hardcoded stats */}

      {/* Core Features Grid */}
      <section className="mb-28 py-16 border-t border-border stagger-3">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-2">Platform Capabilities</h2>
          <p className="text-text-secondary text-sm">Everything you need to optimize your job application success rate</p>
        </div>

        <div className="grid grid-cols-3 gap-6 max-lg:grid-cols-1">
          <div className="p-6 bg-bg-secondary border border-border rounded-md hover:border-primary transition-all duration-500 flex flex-col gap-4">
            <div className="w-12 h-12 rounded-sm bg-success-bg border border-success-border flex items-center justify-center text-xl">
              🎯
            </div>
            <h3 className="text-xl font-bold text-text-primary">AI Compatibility Scoring</h3>
            <p className="text-sm text-text-secondary leading-relaxed m-0">
              Instantly compute matching scores across dozens of software and engineering categories. Find the best match role for your specific tech stack.
            </p>
          </div>

          <div className="p-6 bg-bg-secondary border border-border rounded-md hover:border-primary transition-all duration-500 flex flex-col gap-4">
            <div className="w-12 h-12 rounded-sm bg-info-bg border border-info-border flex items-center justify-center text-xl">
              🔍
            </div>
            <h3 className="text-xl font-bold text-text-primary">Granular Skill Gap Analysis</h3>
            <p className="text-sm text-text-secondary leading-relaxed m-0">
              Compare matched and missing keywords side-by-side. Uncover the exact tools, libraries, and frameworks that recruiters are searching for.
            </p>
          </div>

          <div className="p-6 bg-bg-secondary border border-border rounded-md hover:border-primary transition-all duration-500 flex flex-col gap-4">
            <div className="w-12 h-12 rounded-sm bg-warning-bg border border-warning-border flex items-center justify-center text-xl">
              💡
            </div>
            <h3 className="text-xl font-bold text-text-primary">AI Career Feedback</h3>
            <p className="text-sm text-text-secondary leading-relaxed m-0">
              Get detailed resume audits and recommended course paths generated dynamically by our integration with Groq Llama LLM career coaches.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive FAQ Accordion */}
      <section className="mb-28 max-w-[800px] mx-auto w-full stagger-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-2">Frequently Asked Questions</h2>
          <p className="text-text-secondary text-sm">Answers to common inquiries about parsing and privacy</p>
        </div>

        <div className="flex flex-col gap-4">
          {faqData.map((faq, idx) => (
            <div 
              key={idx} 
              className="bg-bg-secondary border border-border rounded-md overflow-hidden cursor-pointer"
              onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
            >
              <div className="flex justify-between items-center p-5 select-none hover:bg-bg-card-hover transition-colors">
                <span className="font-semibold text-text-primary text-sm">{faq.q}</span>
                <span className={`text-text-tertiary transition-transform duration-300 ${activeFaq === idx ? 'rotate-180' : ''}`}>▾</span>
              </div>
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${activeFaq === idx ? 'max-h-[200px] border-t border-border p-5 bg-bg-tertiary opacity-100' : 'max-h-0 opacity-0'}`}>
                <p className="text-sm text-text-secondary m-0 leading-relaxed">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="mb-20 stagger-5">
        <div className="p-12 text-center bg-bg-secondary border border-border rounded-md relative overflow-hidden flex flex-col items-center gap-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(62,207,142,0.06)_0%,transparent_70%)] pointer-events-none"></div>
          <h2 className="text-4xl font-extrabold text-text-primary tracking-tight m-0 max-sm:text-3xl relative z-10">
            Ready to Optimize Your Resume?
          </h2>
          <p className="text-base text-text-secondary max-w-[50ch] m-0 relative z-10">
            Get instant, AI-powered keyword compatibility scoring and live job matches in seconds.
          </p>
          <div className="relative z-10">
            <Link to="/analyze" className="btn btn-primary px-10 py-3.5 text-base">
              Start Free Resume Scan
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
