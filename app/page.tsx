'use client';

import { useState } from 'react';
import ResumeOptimizer from '@/components/ResumeOptimizer';
import CoverLetterGenerator from '@/components/CoverLetterGenerator';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'job-analysis' | 'resume-optimizer' | 'cover-letter'>('job-analysis');
  const [jobDescription, setJobDescription] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    remaining: number;
    dailyRemaining: number;
  } | null>(null);

  const analyzeJob = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/analyze-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription })
      });

      const data = await response.json();

      if (response.status === 429) {
        alert(data.error);
        return;
      }

      setAnalysis(data.analysis);
      setRateLimitInfo(data.rateLimitStatus);
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  return (
    <main className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">JobGenie</h1>

      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab('job-analysis')}
          className={`px-4 cursor-pointer py-2 rounded-lg font-medium whitespace-nowrap ${activeTab === 'job-analysis'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
        >
          Job Analysis
        </button>
        <button
          onClick={() => setActiveTab('resume-optimizer')}
          className={`cursor-pointer px-4 py-2 rounded-lg font-medium whitespace-nowrap ${activeTab === 'resume-optimizer'
            ? 'bg-green-500 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
        >
          Resume Optimizer
        </button>
        <button
          onClick={() => setActiveTab('cover-letter')}
          className={`cursor-pointer px-4 py-2 rounded-lg font-medium whitespace-nowrap ${activeTab === 'cover-letter'
            ? 'bg-purple-500 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
        >
          Cover Letter
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'job-analysis' && (
        <div>
          {rateLimitInfo && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                Rate Limit: {rateLimitInfo.remaining} requests remaining this minute,
                {rateLimitInfo.dailyRemaining} remaining today
              </p>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Paste Job Description:
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="w-full h-40 p-3 border rounded-lg"
                placeholder="Paste the job description here..."
              />
            </div>

            <button
              onClick={analyzeJob}
              disabled={loading || !jobDescription}
              className="cursor-pointer bg-blue-500 text-white px-6 py-2 rounded-lg disabled:opacity-50"
            >
              {loading ? 'Analyzing...' : 'Analyze Job'}
            </button>

            {analysis && (
              <div className="mt-6 p-4 bg-gray-800 rounded-lg">
                <h3 className="font-bold mb-2">Analysis:</h3>
                <pre className="text-white whitespace-pre-wrap">{analysis}</pre>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'resume-optimizer' && <ResumeOptimizer />}
      {activeTab === 'cover-letter' && <CoverLetterGenerator />}
    </main>
  );
}