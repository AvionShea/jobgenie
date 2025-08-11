'use client';

import { useState } from 'react';

interface StarResult {
    situation?: string;
    task?: string;
    action?: string;
    result?: string;
    starResponse: string;
    tips: string[];
    keyStrengths: string[];
    improvementSuggestions: string[];
    jobRelevance?: string;
}

export default function StarMethodCreator() {
    const [mode, setMode] = useState<'guided' | 'freeform'>('guided');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<StarResult | null>(null);

    // Guided mode inputs
    const [situation, setSituation] = useState('');
    const [task, setTask] = useState('');
    const [action, setAction] = useState('');
    const [resultField, setResultField] = useState(''); // Fixed variable name

    // Freeform mode inputs
    const [freeFormStory, setFreeFormStory] = useState('');
    const [questionType, setQuestionType] = useState('');

    // Job context inputs
    const [useJobContext, setUseJobContext] = useState(false);
    const [jobDescription, setJobDescription] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [companyName, setCompanyName] = useState('');

    const [rateLimitInfo, setRateLimitInfo] = useState<{
        remaining: number;
        dailyRemaining: number;
    } | null>(null);

    const createStarResponse = async () => {
        setLoading(true);
        try {
            const baseRequest = mode === 'guided'
                ? { mode, situation, task, action, result: resultField, questionType }
                : { mode, freeFormStory, questionType };

            // Add job context if enabled
            const requestBody = useJobContext
                ? {
                    ...baseRequest,
                    jobDescription: jobDescription.trim() || undefined,
                    jobTitle: jobTitle.trim() || undefined,
                    companyName: companyName.trim() || undefined
                }
                : baseRequest;

            const response = await fetch('/api/create-star-method', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();

            if (response.status === 429) {
                alert(data.error);
                return;
            }

            if (data.success && data.analysis) {
                setResult(data.analysis);
            } else {
                alert('Failed to create STAR response');
            }

            setRateLimitInfo(data.rateLimitStatus);
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to create STAR response');
        }
        setLoading(false);
    };

    const copyToClipboard = () => {
        if (result?.starResponse) {
            navigator.clipboard.writeText(result.starResponse);
            alert('STAR response copied to clipboard!');
        }
    };

    const isFormValid = () => {
        const baseValid = mode === 'guided'
            ? situation && task && action && resultField
            : freeFormStory;

        if (!useJobContext) return baseValid;

        // If using job context, need either job description OR job title
        return baseValid && (jobDescription.trim() || jobTitle.trim());
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">STAR Method Creator</h2>
                <p className="text-gray-600">Create compelling behavioral interview answers using the STAR method</p>
            </div>

            {rateLimitInfo && (
                <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                        Rate Limit: {rateLimitInfo.remaining} requests remaining this minute,
                        {rateLimitInfo.dailyRemaining} remaining today
                    </p>
                </div>
            )}

            {/* Mode Selection */}
            <div className="flex justify-center space-x-4">
                <button
                    onClick={() => setMode('guided')}
                    className={`px-6 py-3 rounded-lg font-medium cursor-pointer transition-colors ${mode === 'guided'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                >
                    📝 Guided Input
                </button>
                <button
                    onClick={() => setMode('freeform')}
                    className={`px-6 py-3 rounded-lg font-medium cursor-pointer transition-colors ${mode === 'freeform'
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                >
                    ✨ Story to STAR
                </button>
            </div>

            {/* Job Context Toggle */}
            <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-3 mb-3">
                    <input
                        type="checkbox"
                        id="useJobContext"
                        checked={useJobContext}
                        onChange={(e) => setUseJobContext(e.target.checked)}
                        className="w-4 h-4"
                    />
                    <label htmlFor="useJobContext" className="font-medium text-yellow-800">
                        🎯 Tailor response to specific job
                    </label>
                </div>

                {useJobContext && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-black font-medium mb-2">
                                Option 1: Job Description (Recommended)
                            </label>
                            <textarea
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                                className="w-full h-32 p-3 border rounded-lg text-black"
                                placeholder="Paste the full job description here for the most tailored response..."
                            />
                        </div>

                        <div className="text-center text-gray-500 font-medium">OR</div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-black mb-2">
                                    Option 2: Job Title *
                                </label>
                                <input
                                    type="text"
                                    value={jobTitle}
                                    onChange={(e) => setJobTitle(e.target.value)}
                                    className="w-full p-3 border rounded-lg text-black"
                                    placeholder="e.g. Senior Software Engineer"
                                    disabled={!!jobDescription.trim()}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2 text-black">
                                    Company (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    className="w-full p-3 border rounded-lg text-black"
                                    placeholder="e.g. Google"
                                    disabled={!!jobDescription.trim()}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Optional Question Type */}
            <div>
                <label className="block text-sm font-medium mb-2">
                    Interview Question Type (Optional):
                </label>
                <select
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value)}
                    className="w-full p-3 border rounded-lg bg-white text-black"
                >
                    <option value="">Select question type...</option>
                    <option value="leadership">Leadership & Management</option>
                    <option value="problem-solving">Problem Solving</option>
                    <option value="teamwork">Teamwork & Collaboration</option>
                    <option value="conflict-resolution">Conflict Resolution</option>
                    <option value="time-management">Time Management</option>
                    <option value="innovation">Innovation & Creativity</option>
                    <option value="failure-learning">Failure & Learning</option>
                    <option value="achievement">Greatest Achievement</option>
                </select>
            </div>

            {/* Guided Mode */}
            {mode === 'guided' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-blue-700">
                            🏢 Situation - Set the scene
                        </label>
                        <textarea
                            value={situation}
                            onChange={(e) => setSituation(e.target.value)}
                            className="w-full h-24 p-3 border rounded-lg"
                            placeholder="Describe the context and background. Where were you? What was happening?"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-green-700">
                            🎯 Task - What needed to be done?
                        </label>
                        <textarea
                            value={task}
                            onChange={(e) => setTask(e.target.value)}
                            className="w-full h-24 p-3 border rounded-lg"
                            placeholder="What was your responsibility? What challenge did you face?"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-purple-700">
                            ⚡ Action - What you did
                        </label>
                        <textarea
                            value={action}
                            onChange={(e) => setAction(e.target.value)}
                            className="w-full h-24 p-3 border rounded-lg"
                            placeholder="What specific steps did you take? Focus on YOUR actions."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-orange-700">
                            🏆 Result - What was achieved
                        </label>
                        <textarea
                            value={resultField}
                            onChange={(e) => setResultField(e.target.value)}
                            className="w-full h-24 p-3 border rounded-lg"
                            placeholder="What was the outcome? Include specific metrics if possible."
                        />
                    </div>
                </div>
            )}

            {/* Freeform Mode */}
            {mode === 'freeform' && (
                <div>
                    <label className="block text-sm font-medium mb-2">
                        📚 Tell Your Story - JobGenie will structure it into STAR format
                    </label>
                    <textarea
                        value={freeFormStory}
                        onChange={(e) => setFreeFormStory(e.target.value)}
                        className="w-full h-48 p-3 border rounded-lg"
                        placeholder="Describe your experience in your own words. Include the situation, what you had to do, your actions, and what happened as a result. Don't worry about structure - JobGenie will organize it for you!"
                    />
                </div>
            )}

            <button
                onClick={createStarResponse}
                disabled={loading || !isFormValid()}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg disabled:opacity-50 font-medium text-lg cursor-pointer"
            >
                {loading ? 'Creating STAR Response...' : '✨ Create STAR Response'}
            </button>

            {/* Results */}
            {result && (
                <div className="mt-8 space-y-6">
                    {/* Job Relevance */}
                    {result.jobRelevance && useJobContext && (
                        <div className="p-4 bg-yellow-50 rounded-lg">
                            <h3 className="font-bold text-lg mb-2 text-yellow-800">🎯 Job Relevance</h3>
                            <p className="text-yellow-700">{result.jobRelevance}</p>
                        </div>
                    )}

                    {/* Freeform mode shows breakdown */}
                    {mode === 'freeform' && result.situation && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-blue-50 rounded-lg">
                                <h4 className="font-bold text-blue-800 mb-2">🏢 Situation</h4>
                                <p className="text-blue-700">{result.situation}</p>
                            </div>
                            <div className="p-4 bg-green-50 rounded-lg">
                                <h4 className="font-bold text-green-800 mb-2">🎯 Task</h4>
                                <p className="text-green-700">{result.task}</p>
                            </div>
                            <div className="p-4 bg-purple-50 rounded-lg">
                                <h4 className="font-bold text-purple-800 mb-2">⚡ Action</h4>
                                <p className="text-purple-700">{result.action}</p>
                            </div>
                            <div className="p-4 bg-orange-50 rounded-lg">
                                <h4 className="font-bold text-orange-800 mb-2">🏆 Result</h4>
                                <p className="text-orange-700">{result.result}</p>
                            </div>
                        </div>
                    )}

                    {/* Complete STAR Response */}
                    <div className="p-6 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-black">🌟 Your STAR Response</h3>
                            <button
                                onClick={copyToClipboard}
                                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 text-sm"
                            >
                                Copy Response
                            </button>
                        </div>
                        <div className="prose max-w-none">
                            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                                {result.starResponse}
                            </p>
                        </div>
                    </div>

                    {/* Tips */}
                    <div className="p-4 bg-green-50 rounded-lg">
                        <h3 className="font-bold text-lg mb-2 text-green-800">💡 Delivery Tips</h3>
                        <ul className="list-disc list-inside space-y-1">
                            {result.tips.map((tip, index) => (
                                <li key={index} className="text-green-700">{tip}</li>
                            ))}
                        </ul>
                    </div>

                    {/* Key Strengths */}
                    <div className="p-4 bg-blue-50 rounded-lg">
                        <h3 className="font-bold text-lg mb-2 text-blue-800">💪 Key Strengths Demonstrated</h3>
                        <div className="flex flex-wrap gap-2">
                            {result.keyStrengths.map((strength, index) => (
                                <span key={index} className="bg-blue-200 px-3 py-1 rounded-full text-sm font-medium text-black">
                                    {strength}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Improvement Suggestions */}
                    <div className="p-4 bg-yellow-50 rounded-lg">
                        <h3 className="font-bold text-lg mb-2 text-yellow-800">🚀 Enhancement Ideas</h3>
                        <ul className="list-disc list-inside space-y-1">
                            {result.improvementSuggestions.map((suggestion, index) => (
                                <li key={index} className="text-yellow-700">{suggestion}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}