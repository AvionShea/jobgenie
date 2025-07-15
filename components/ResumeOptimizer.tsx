'use client';

import { useState } from 'react';

interface OptimizationResult {
    targetJobTitle: string;
    matchScore: number;
    strengths: string[];
    gaps: string[];
    recommendations: string[];
    keywordsToAdd: string[];
    transferableSkills: string[];
    optimizedSummary: string;
    implementedSuggestions: string;
}

export default function ResumeOptimizer() {
    const [resumeText, setResumeText] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [result, setResult] = useState<OptimizationResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [rateLimitInfo, setRateLimitInfo] = useState<{
        remaining: number;
        dailyRemaining: number;
    } | null>(null);

    const optimizeResume = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/optimize-resume', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resumeText, jobDescription })
            });

            const data = await response.json();

            if (response.status === 429) {
                alert(data.error);
                return;
            }

            if (!response.ok) {
                throw new Error(data.error || 'Server error occurred');
            }

            console.log('Received data:', data);
            console.log('Analysis type:', typeof data.analysis);

            // Handle both object and string responses
            if (data.success && data.analysis) {
                let finalResult;
                if (typeof data.analysis === 'object') {
                    finalResult = data.analysis;
                } else if (typeof data.analysis === 'string') {
                    // API returned string, need to parse
                    try {
                        finalResult = JSON.parse(data.analysis);
                    } catch (parseError) {
                        console.error('Failed to parse JSON:', parseError);
                        console.log('Raw AI response:', data.analysis);
                        alert('AI response format error. Check console for details.');
                        finalResult = createFallbackResult(data.analysis);
                    }
                }
                // Validate and sanitize the result
                const sanitizedResult = sanitizeResult(finalResult);
                setResult(sanitizedResult);
            } else {
                console.error('Invalid response structure:', data);
                alert('Invalid response from server');
                throw new Error('Invalid response structure from server');
            }

            setRateLimitInfo(data.rateLimitStatus);
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to optimize resume');
            // Create a basic fallback result even when everything fails
            const emergencyFallback = createEmergencyFallback();
            setResult(emergencyFallback);

            // Show user-friendly error but don't break the app
            alert('JobGenie encountered an issue but created a basic analysis. Please try again for better results.');
        }
        setLoading(false);
    };

    // helper functions:
    const createFallbackResult = (rawText: string): OptimizationResult => {
        return {
            targetJobTitle: "Unable to parse job title",
            matchScore: 50,
            strengths: ["Resume submitted successfully", "Contains relevant experience"],
            gaps: ["Unable to analyze specific gaps", "Please try again for detailed analysis"],
            recommendations: ["Reformat resume for better parsing", "Ensure clear section headers", "Try submitting again"],
            keywordsToAdd: ["Unable to extract keywords"],
            transferableSkills: ["Communication", "Problem-solving", "Teamwork"],
            optimizedSummary: "Resume analysis encountered formatting issues. Please resubmit with clear formatting.",
            implementedSuggestions: rawText.substring(0, 500) + "...\n\n[Analysis incomplete due to formatting issues]"
        };
    };

    const createEmergencyFallback = (): OptimizationResult => {
        return {
            targetJobTitle: "Analysis Error",
            matchScore: 0,
            strengths: ["Resume received"],
            gaps: ["Unable to complete analysis"],
            recommendations: ["Please try again", "Check internet connection", "Ensure resume has clear formatting"],
            keywordsToAdd: ["Please resubmit"],
            transferableSkills: ["Communication", "Problem-solving"],
            optimizedSummary: "JobGenie encountered an error during analysis. Please try again.",
            implementedSuggestions: "Analysis could not be completed. Please resubmit your resume."
        };
    };

    const sanitizeResult = (result: any): OptimizationResult => {
        return {
            targetJobTitle: String(result?.targetJobTitle || "Position Not Specified"),
            matchScore: Number(result?.matchScore) || 0,
            strengths: Array.isArray(result?.strengths) ? result.strengths.map(String) : ["Resume submitted"],
            gaps: Array.isArray(result?.gaps) ? result.gaps.map(String) : ["Analysis incomplete"],
            recommendations: Array.isArray(result?.recommendations) ? result.recommendations.map(String) : ["Please try again"],
            keywordsToAdd: Array.isArray(result?.keywordsToAdd) ? result.keywordsToAdd.map(String) : ["Keywords not found"],
            transferableSkills: Array.isArray(result?.transferableSkills) ? result.transferableSkills.map(String) : ["Communication", "Problem-solving"],
            optimizedSummary: String(result?.optimizedSummary || "Summary could not be generated"),
            implementedSuggestions: String(result?.implementedSuggestions || "Suggestions could not be generated")
        };
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Resume Optimizer</h2>

            {rateLimitInfo && (
                <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                        Rate Limit: {rateLimitInfo.remaining} requests remaining this minute;
                        {rateLimitInfo.dailyRemaining} remaining today
                    </p>
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Your Current Resume:
                    </label>
                    <textarea
                        value={resumeText}
                        onChange={(e) => setResumeText(e.target.value)}
                        className="w-full h-48 p-3 border rounded-lg"
                        placeholder="Paste your current resume text here..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">
                        Target Job Description:
                    </label>
                    <textarea
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        className="w-full h-48 p-3 border rounded-lg"
                        placeholder="Paste the job description you're targeting..."
                    />
                </div>
            </div>

            <button
                onClick={optimizeResume}
                disabled={loading || !resumeText || !jobDescription}
                className="bg-green-500 text-white px-6 py-2 rounded-lg disabled:opacity-50"
            >
                {loading ? 'Optimizing Resume...' : 'Optimize Resume'}
            </button>

            {result && (
                <div className="mt-8 space-y-6">
                    {/* Target Job Title */}
                    <div className="p-4 bg-indigo-50 rounded-lg">
                        <h3 className="font-bold text-lg mb-2 text-indigo-800">Target Job Title</h3>
                        <div className="text-2xl font-bold text-indigo-900">
                            {result.targetJobTitle}
                        </div>
                    </div>

                    {/* Match Score */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-bold text-black text-lg mb-2">Match Score</h3>
                        <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-4">
                                <div
                                    className="bg-green-500 h-4 rounded-full"
                                    style={{ width: `${result.matchScore}%` }}
                                ></div>
                            </div>
                            <span className="ml-3 text-black font-bold text-lg">{result.matchScore}%</span>
                        </div>
                    </div>

                    {/* Strengths */}
                    <div className="p-4 bg-green-50 rounded-lg">
                        <h3 className="font-bold text-lg mb-2 text-green-800">Your Strengths</h3>
                        <ul className="list-disc list-inside space-y-1">
                            {result.strengths?.map((strength, index) => (
                                <li key={index} className="text-green-700">{strength}</li>
                            ))}
                        </ul>
                    </div>

                    {/* Transferable Skills */}
                    <div className="p-4 bg-orange-50 rounded-lg">
                        <h3 className="font-bold text-lg mb-2 text-orange-800">Transferable Skills</h3>
                        <div className="flex flex-wrap gap-2">
                            {result.transferableSkills?.map((skill, index) => (
                                <span key={index} className="bg-orange-200 px-3 py-1 rounded-full text-black text-sm">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Gaps */}
                    <div className="p-4 bg-red-50 rounded-lg">
                        <h3 className="font-bold text-lg mb-2 text-red-800">Areas to Address</h3>
                        <ul className="list-disc list-inside space-y-1">
                            {result.gaps?.map((gap, index) => (
                                <li key={index} className="text-red-700">{gap}</li>
                            ))}
                        </ul>
                    </div>

                    {/* Recommendations */}
                    <div className="p-4 bg-blue-50 rounded-lg">
                        <h3 className="font-bold text-lg mb-2 text-blue-800">Specific Recommendations</h3>
                        <ul className="list-disc list-inside space-y-1">
                            {result.recommendations?.map((rec, index) => (
                                <li key={index} className="text-blue-700">{rec}</li>
                            ))}
                        </ul>
                    </div>

                    {/* Keywords */}
                    <div className="p-4 bg-purple-50 rounded-lg">
                        <h3 className="font-bold text-lg mb-2 text-purple-800">Keywords to Include</h3>
                        <div className="flex flex-wrap gap-2">
                            {result.keywordsToAdd?.map((keyword, index) => (
                                <span key={index} className="bg-purple-200 text-black px-3 py-1 rounded-full text-sm">
                                    {keyword}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Optimized Summary */}
                    <div className="p-4 bg-yellow-50 rounded-lg">
                        <h3 className="font-bold text-lg mb-2 text-yellow-800">Optimized Professional Summary</h3>
                        <p className="text-yellow-700 italic">{result.optimizedSummary}</p>
                    </div>

                    {/* Implemented Suggestions */}
                    <div className="p-4 bg-pink-50 rounded-lg">
                        <div className="mb-4 p-3 bg-red-100 rounded border-l-4 border-red-500">
                            <p className="text-red-800 text-xl font-semibold">
                                ⚠️ Important: These are suggestions only! Review and customize before using.
                            </p>
                        </div>
                        <h3 className="font-bold text-lg mb-2 text-pink-800">Implemented Suggestions</h3>
                        <div className="text-pink-700 whitespace-pre-wrap">{result.implementedSuggestions}</div>
                    </div>
                </div>
            )}
        </div>
    );
}