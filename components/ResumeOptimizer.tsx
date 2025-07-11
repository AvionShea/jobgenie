"use client";

import { useState } from "react";

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
            const response = await fetch("/api/optimize-resume", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ resumeText, jobDescription })
            });

            const data = await response.json();

            if (response.status === 429) {
                alert(data.error);
                return;
            }

            try {
                const parsedResult = JSON.parse(data.analysis);
                setResult(parsedResult);
            } catch (parseError) {
                // If JSON parsing fails, show raw response
                console.log('Raw AI response:', data.analysis);
                alert('AI response format error. Check console for details.');
            }

            setRateLimitInfo(data.rateLimitStatus);

        } catch (error) {
            console.error("Error", error);
            alert("Failed to optimize resume.");
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Resume Optimizer</h2>

            {rateLimitInfo && (
                <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                        Rate Limit: {rateLimitInfo.remaining} requests remaining this minute; {rateLimitInfo.dailyRemaining} remaining today.
                    </p>
                </div>
            )}
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-lg font-medium mb-2">
                        Your Current Resume:
                    </label>
                    <textarea value={resumeText}
                        onChange={(e) => setResumeText(e.target.value)}
                        className="w-full h-48 p-3 border rounded-lg"
                        placeholder="Paste your current resume text here..."
                    />
                </div>
                <div>
                    <label className="block text-lg font-medium mb-2">
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
                className="bg-green-500 text-white px-6 py-2 rounded-lg disabled:opacity-50 cursor-pointer"
            >
                {loading ? 'Optimizing Resume...' : 'Optimize Resume'}
            </button>

            {result && (
                <div className="mt-8 space-y-6">
                    {/*Target Job Title */}
                    <div>
                        <h3 className="font-bold text-xl mb-2 text-green-800">Target Job Title</h3>
                        <h2 className="list-disc list-inside space-y-1 text-4xl">
                            {result.targetJobTitle}
                        </h2>
                    </div>

                    {/* Match Score */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-bold text-lg text-black mb-2">Match Score</h3>
                        <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-4">
                                <div
                                    className="bg-green-500 h-4 rounded-full"
                                    style={{ width: `${result.matchScore}%` }}
                                ></div>
                            </div>
                            <span className="ml-3 font-bold text-black text-lg">{result.matchScore}%</span>
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
                    <div className="p-4 bg-purple-50 text-black rounded-lg">
                        <h3 className="font-bold text-lg mb-2 text-purple-800">Keywords to Include in Resume</h3>
                        <div className="flex flex-wrap gap-2">
                            {result.keywordsToAdd?.map((keyword, index) => (
                                <span key={index} className="bg-purple-200 px-3 py-1 rounded-full text-sm">
                                    {keyword}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Transferable Skills */}
                    <div className="p-4 bg-orange-50 text-black rounded-lg">
                        <h3 className="font-bold text-lg mb-2 text-orange-800">Transferable Skills</h3>
                        <div className="flex flex-wrap gap-2">
                            {result.transferableSkills?.map((skill, index) => (
                                <span key={index} className="bg-orange-200 px-3 py-1 rounded-full text-sm">
                                    {skill}
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
                        <p className="text-black text-3xl">Please review! These are <span className="font-bold font-italic text-red-700">suggestions</span>! Do <span className="font-bold font-italic text-red-700">NOT</span> copy and paste.</p>
                        <h3 className="font-bold text-lg mb-2 text-pink-800">Implemented Suggestions</h3>

                        <p className="text-pink-700">{result.implementedSuggestions}</p>
                    </div>

                </div>
            )}
        </div>
    );
}