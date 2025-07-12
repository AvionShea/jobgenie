'use client';

import { useState } from 'react';

export default function CoverLetterGenerator() {
    const [resumeText, setResumeText] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [hiringManager, setHiringManager] = useState('');
    const [tone, setTone] = useState<'professional' | 'enthusiastic' | 'creative' | 'direct'>('professional');
    const [coverLetter, setCoverLetter] = useState('');
    const [loading, setLoading] = useState(false);
    const [rateLimitInfo, setRateLimitInfo] = useState<{
        remaining: number;
        dailyRemaining: number;
    } | null>(null);

    const generateCoverLetter = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/generate-cover-letter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    resumeText,
                    jobDescription,
                    tone,
                    companyName: companyName.trim() || undefined,
                    hiringManager: hiringManager.trim() || undefined
                })
            });

            const data = await response.json();

            if (response.status === 429) {
                alert(data.error);
                return;
            }

            setCoverLetter(data.coverLetter);
            setRateLimitInfo(data.rateLimitStatus);
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to generate cover letter');
        }
        setLoading(false);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(coverLetter);
        alert('Cover letter copied to clipboard!');
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Cover Letter Generator</h2>

            {rateLimitInfo && (
                <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                        Rate Limit: {rateLimitInfo.remaining} requests remaining this minute;
                        {rateLimitInfo.dailyRemaining} remaining today
                    </p>
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
                {/* Left Column - Inputs */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Your Resume Text:
                        </label>
                        <textarea
                            value={resumeText}
                            onChange={(e) => setResumeText(e.target.value)}
                            className="w-full h-32 p-3 border rounded-lg"
                            placeholder="Paste your resume or key highlights..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Job Description:
                        </label>
                        <textarea
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            className="w-full h-32 p-3 border rounded-lg"
                            placeholder="Paste the job description..."
                        />
                    </div>

                    {/* Optional Fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Company Name (Optional):
                            </label>
                            <input
                                type="text"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                className="w-full p-3 border rounded-lg"
                                placeholder="e.g. Google"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Hiring Manager (Optional):
                            </label>
                            <input
                                type="text"
                                value={hiringManager}
                                onChange={(e) => setHiringManager(e.target.value)}
                                className="w-full p-3 border rounded-lg"
                                placeholder="e.g. Regina Smith"
                            />
                        </div>
                    </div>

                    {/* Tone Selection */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Tone:
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { value: 'professional', label: 'Professional', desc: 'Formal & business-like' },
                                { value: 'enthusiastic', label: 'Enthusiastic', desc: 'Energetic & passionate' },
                                { value: 'creative', label: 'Creative', desc: 'Unique & memorable' },
                                { value: 'direct', label: 'Direct', desc: 'Clear & concise' }
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setTone(option.value as any)}
                                    className={`p-3 text-left border rounded-lg cursor-pointer transition-colors ${tone === option.value
                                        ? 'bg-blue-500 text-white border-blue-500'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="font-medium">{option.label}</div>
                                    <div className="text-xs opacity-75">{option.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={generateCoverLetter}
                        disabled={loading || !resumeText || !jobDescription}
                        className="w-full bg-purple-500 text-white px-6 py-3 rounded-lg disabled:opacity-50 font-medium cursor-pointer"
                    >
                        {loading ? 'Generating Cover Letter...' : 'Generate Cover Letter'}
                    </button>
                </div>

                {/* Right Column - Output */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="block text-sm font-medium">
                            Generated Cover Letter:
                        </label>
                        {coverLetter && (
                            <button
                                onClick={copyToClipboard}
                                className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
                            >
                                Copy to Clipboard
                            </button>
                        )}
                    </div>

                    <div className="w-full h-96 p-4 border rounded-lg bg-gray-50 overflow-y-auto">
                        {coverLetter ? (
                            <div className="whitespace-pre-wrap text-sm text-black leading-relaxed">
                                {coverLetter}
                            </div>
                        ) : (
                            <div className="text-gray-500 italic">
                                Your generated cover letter will appear here...
                            </div>
                        )}
                    </div>

                    {coverLetter && (
                        <div className="text-xs text-gray-600 space-y-1">
                            <p><strong>Tip:</strong> Review and personalize the cover letter before sending.</p>
                            <p><strong>Word count:</strong> ~{coverLetter.split(' ').length} words</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}