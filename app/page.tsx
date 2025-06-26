'use client';

import { useState } from 'react';

export default function Home() {
  const [jobDescription, setJobDescription] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);

  const analyzeJob = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/analyze-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription })
      });

      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  return (
    <main className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">AI Job Assistant</h1>

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
          className="bg-blue-500 text-white px-6 py-2 rounded-lg disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : 'Analyze Job'}
        </button>

        {analysis && (
          <div className="mt-6 p-4 bg-black-100 rounded-lg">
            <h3 className="font-bold mb-2">Analysis:</h3>
            <pre className="whitespace-pre-wrap">{analysis}</pre>
          </div>
        )}
      </div>
    </main>
  );
}