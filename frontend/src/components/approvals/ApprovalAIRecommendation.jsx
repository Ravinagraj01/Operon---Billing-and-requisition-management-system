// frontend/src/components/approvals/ApprovalAIRecommendation.jsx

import { useState } from "react"
import {
    Sparkles, Loader2, AlertCircle, CheckCircle,
    ThumbsUp, AlertTriangle, ChevronDown, ChevronUp,
    Shield, Copy, Check
} from "lucide-react"
import api from "../../api/axios"

// ── Risk / Recommendation Badge ───────────────────────────────────
function RecommendationBadge({ recommendation, confidence }) {
    const isApprove = recommendation === "approve"
    return (
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg
                        font-semibold text-sm
                        ${isApprove
                            ? "bg-green-500/10 text-green-400 border border-green-500/25"
                            : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/25"
                        }`}>
            {isApprove
                ? <ThumbsUp size={15} />
                : <AlertTriangle size={15} />
            }
            <span>
                {isApprove ? "Recommended: Approve" : "Recommended: Review Carefully"}
            </span>
            <span className={`ml-1 text-xs font-normal opacity-70`}>
                ({confidence} confidence)
            </span>
        </div>
    )
}

// ── Copy Button ───────────────────────────────────────────────────
function CopyButton({ text }) {
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 text-xs
                       text-gray-400 hover:text-white border border-white/10
                       hover:border-white/20 rounded transition-colors"
        >
            {copied
                ? <><Check size={11} className="text-green-400" /> Copied</>
                : <><Copy size={11} /> Copy</>
            }
        </button>
    )
}

// ── Main Component ────────────────────────────────────────────────
export default function ApprovalAIRecommendation({
    requisitionId,
    onUseSuggestedComment
}) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [result, setResult] = useState(null)
    const [collapsed, setCollapsed] = useState(false)
    const [generated, setGenerated] = useState(false)

    const fetchRecommendation = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await api.post(
                `/ai/assistant/approval-recommendation/${requisitionId}`
            )
            setResult(res.data)
            setGenerated(true)
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                "Could not generate recommendation. Please review manually."
            )
        } finally {
            setLoading(false)
        }
    }

    const handleUseComment = () => {
        if (result?.suggested_comment && onUseSuggestedComment) {
            onUseSuggestedComment(result.suggested_comment)
        }
    }

    return (
        <div className="bg-gray-900 border border-yellow-500/20
                        rounded-xl overflow-hidden">

            {/* ── Header ─────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-5 py-4
                            border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-yellow-500/10 rounded-lg">
                        <Sparkles size={15} className="text-yellow-400" />
                    </div>
                    <div>
                        <div className="text-white font-semibold text-sm">
                            AI Approval Recommendation
                        </div>
                        <div className="text-gray-400 text-xs mt-0.5">
                            Powered by Groq — analyses historical data
                            to recommend a decision
                        </div>
                    </div>
                </div>
                {generated && (
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="p-1.5 hover:bg-white/5 rounded-lg
                                   text-gray-400 hover:text-white
                                   transition-colors"
                    >
                        {collapsed
                            ? <ChevronDown size={15} />
                            : <ChevronUp size={15} />
                        }
                    </button>
                )}
            </div>

            {/* ── Body ───────────────────────────────────────────── */}
            <div className="px-5 py-4 space-y-4">

                {/* Generate button — shown before first generation */}
                {!generated && !loading && (
                    <button
                        onClick={fetchRecommendation}
                        className="flex items-center gap-2 px-4 py-2.5
                                   bg-yellow-600/80 hover:bg-yellow-600
                                   text-white text-sm font-semibold
                                   rounded-lg transition-colors w-full
                                   justify-center"
                    >
                        <Sparkles size={15} />
                        Generate AI Recommendation
                    </button>
                )}

                {/* Loading */}
                {loading && (
                    <div className="flex items-center justify-center
                                    gap-3 py-6">
                        <Loader2 size={18}
                            className="animate-spin text-yellow-400" />
                        <span className="text-gray-400 text-sm">
                            Analysing requisition and historical data...
                        </span>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="flex items-start gap-2 p-3
                                    bg-red-500/10 border border-red-500/20
                                    rounded-lg">
                        <AlertCircle size={15}
                            className="text-red-400 mt-0.5 shrink-0" />
                        <span className="text-red-400 text-xs">{error}</span>
                    </div>
                )}

                {/* Result */}
                {result && !collapsed && (
                    <div className="space-y-4">

                        {/* Recommendation badge */}
                        <RecommendationBadge
                            recommendation={result.recommendation}
                            confidence={result.confidence}
                        />

                        {/* Reason */}
                        <div className="bg-gray-800/60 rounded-lg p-3">
                            <div className="text-xs text-gray-500
                                            uppercase tracking-wider
                                            font-medium mb-1.5">
                                Analysis
                            </div>
                            <p className="text-gray-200 text-sm leading-relaxed">
                                {result.reason}
                            </p>
                        </div>

                        {/* Positive + Risk factors */}
                        <div className="grid grid-cols-2 gap-3">
                            {result.positive_factors?.length > 0 && (
                                <div className="bg-green-500/5 border
                                                border-green-500/15
                                                rounded-lg p-3">
                                    <div className="text-xs text-green-400
                                                    font-medium mb-2
                                                    flex items-center gap-1">
                                        <CheckCircle size={11} />
                                        Positive Signals
                                    </div>
                                    <ul className="space-y-1">
                                        {result.positive_factors.map(
                                            (f, i) => (
                                            <li key={i}
                                                className="text-xs
                                                           text-gray-300
                                                           flex items-start
                                                           gap-1.5">
                                                <span className="text-green-500
                                                                 mt-0.5">
                                                    ·
                                                </span>
                                                {f}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {result.risk_factors?.length > 0 && (
                                <div className="bg-red-500/5 border
                                                border-red-500/15
                                                rounded-lg p-3">
                                    <div className="text-xs text-red-400
                                                    font-medium mb-2
                                                    flex items-center gap-1">
                                        <AlertTriangle size={11} />
                                        Risk Factors
                                    </div>
                                    <ul className="space-y-1">
                                        {result.risk_factors.map(
                                            (f, i) => (
                                            <li key={i}
                                                className="text-xs
                                                           text-gray-300
                                                           flex items-start
                                                           gap-1.5">
                                                <span className="text-red-500
                                                                 mt-0.5">
                                                    ·
                                                </span>
                                                {f}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Suggested comment */}
                        <div className="bg-gray-800/60 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-xs text-gray-500
                                                uppercase tracking-wider
                                                font-medium">
                                    Suggested Comment
                                </div>
                                <div className="flex gap-2">
                                    <CopyButton
                                        text={result.suggested_comment} />
                                    <button
                                        onClick={handleUseComment}
                                        className="flex items-center gap-1
                                                   px-2 py-1 text-xs
                                                   text-blue-400
                                                   hover:text-blue-300
                                                   border border-blue-500/20
                                                   hover:border-blue-500/40
                                                   rounded transition-colors"
                                    >
                                        Use This
                                    </button>
                                </div>
                            </div>
                            <p className="text-gray-300 text-xs
                                         leading-relaxed italic">
                                "{result.suggested_comment}"
                            </p>
                        </div>

                        {/* Regenerate button */}
                        <button
                            onClick={fetchRecommendation}
                            className="text-xs text-gray-500
                                       hover:text-gray-300 transition-colors
                                       flex items-center gap-1"
                        >
                            <Sparkles size={11} />
                            Regenerate recommendation
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}