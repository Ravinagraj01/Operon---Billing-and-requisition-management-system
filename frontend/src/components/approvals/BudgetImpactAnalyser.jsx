// frontend/src/components/approvals/BudgetImpactAnalyser.jsx

import { useState } from "react"
import {
    TrendingUp, Loader2, AlertCircle, AlertTriangle,
    CheckCircle, BarChart2, Sparkles, Copy, Check,
    ChevronDown, ChevronUp, Shield
} from "lucide-react"
import api from "../../api/axios"

// ── Risk Level Badge ──────────────────────────────────────────────
function RiskBadge({ risk_level, risk_label }) {
    const config = {
        low: {
            style: "bg-green-500/10 text-green-400 border-green-500/25",
            icon: <CheckCircle size={14} />
        },
        medium: {
            style: "bg-yellow-500/10 text-yellow-400 border-yellow-500/25",
            icon: <AlertTriangle size={14} />
        },
        high: {
            style: "bg-red-500/10 text-red-400 border-red-500/25",
            icon: <AlertCircle size={14} />
        }
    }
    const c = config[risk_level] || config.medium
    return (
        <div className={`flex items-center gap-2 px-4 py-2
                        rounded-lg font-semibold text-sm border
                        ${c.style}`}>
            {c.icon}
            Budget Risk: {risk_label}
        </div>
    )
}

// ── Deviation Indicator ───────────────────────────────────────────
function DeviationBar({ deviation_percent, is_above }) {
    const absVal = Math.min(Math.abs(deviation_percent), 100)
    return (
        <div>
            <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">vs Category Average</span>
                <span className={is_above
                    ? "text-red-400 font-medium"
                    : "text-green-400 font-medium"}>
                    {is_above ? "+" : ""}{deviation_percent}%
                </span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-700
                               ${is_above ? "bg-red-500" : "bg-green-500"}`}
                    style={{ width: `${absVal}%` }}
                />
            </div>
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
export default function BudgetImpactAnalyser({
    requisitionId,
    onUseSuggestedNote,
    userRole = "finance"  // Default to finance, but will be passed
}) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [result, setResult] = useState(null)
    const [collapsed, setCollapsed] = useState(false)
    const [generated, setGenerated] = useState(false)

    // Role-based configuration
    const isAdmin = userRole === "admin"
    const config = {
        finance: {
            title: "AI Budget Impact Analyser",
            description: "Analyses spend history and category data to assess financial risk",
            buttonText: "Run Budget Impact Analysis",
            actionText: "Use Suggested Note",
            iconColor: "text-blue-400",
            bgColor: "bg-blue-500/10",
            borderColor: "border-blue-500/20"
        },
        admin: {
            title: "Admin Budget Oversight",
            description: "Comprehensive budget analysis for administrative review and intervention",
            buttonText: "Run Admin Budget Review",
            actionText: "Apply Admin Override",
            iconColor: "text-purple-400",
            bgColor: "bg-purple-500/10",
            borderColor: "border-purple-500/20"
        }
    }
    const uiConfig = config[userRole] || config.finance

    const fetchAnalysis = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await api.post(
                `/ai/assistant/budget-impact/${requisitionId}`
            )
            setResult(res.data)
            setGenerated(true)
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                "Could not generate analysis. Please review manually."
            )
        } finally {
            setLoading(false)
        }
    }

    const handleUseNote = () => {
        if (result?.suggested_finance_note && onUseSuggestedNote) {
            onUseSuggestedNote(result.suggested_finance_note)
        }
    }

    return (
        <div className={`bg-gray-900 border ${uiConfig.borderColor}
                        rounded-xl overflow-hidden`}>

            {/* ── Header ─────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-5 py-4
                            border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className={`p-1.5 ${uiConfig.bgColor} rounded-lg`}>
                        <BarChart2 size={15} className={uiConfig.iconColor} />
                    </div>
                    <div>
                        <div className="text-white font-semibold text-sm">
                            {uiConfig.title}
                        </div>
                        <div className="text-gray-400 text-xs mt-0.5">
                            {uiConfig.description}
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

                {/* Generate button */}
                {!generated && !loading && (
                    <button
                        onClick={fetchAnalysis}
                        className="flex items-center gap-2 px-4 py-2.5
                                   bg-blue-600 hover:bg-blue-500
                                   text-white text-sm font-semibold
                                   rounded-lg transition-colors w-full
                                   justify-center"
                    >
                        <BarChart2 size={15} />
                        {uiConfig.buttonText}
                    </button>
                )}

                {/* Loading */}
                {loading && (
                    <div className="flex items-center justify-center
                                    gap-3 py-6">
                        <Loader2 size={18}
                            className="animate-spin text-blue-400" />
                        <span className="text-gray-400 text-sm">
                            Analysing spend history and budget data...
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

                        {/* Risk badge */}
                        <RiskBadge
                            risk_level={result.risk_level}
                            risk_label={result.risk_label}
                        />

                        {/* Key metrics row */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-800/60 rounded-lg p-3">
                                <div className="text-xs text-gray-500
                                                uppercase tracking-wider mb-1">
                                    Budget Impact
                                </div>
                                <div className="text-white font-bold text-lg">
                                    {result.budget_impact_percent}%
                                </div>
                                <div className="text-gray-500 text-xs">
                                    of quarterly budget
                                </div>
                            </div>
                            <div className="bg-gray-800/60 rounded-lg p-3">
                                <div className="text-xs text-gray-500
                                                uppercase tracking-wider mb-1">
                                    vs Category Avg
                                </div>
                                <div className={`font-bold text-lg
                                    ${result.is_above_category_average
                                        ? "text-red-400"
                                        : "text-green-400"}`}>
                                    {result.is_above_category_average
                                        ? "Above"
                                        : "Below"}
                                </div>
                                <div className="text-gray-500 text-xs">
                                    {Math.abs(result.deviation_percent)}%
                                    {result.is_above_category_average
                                        ? " higher"
                                        : " lower"}
                                </div>
                            </div>
                        </div>

                        {/* Deviation bar */}
                        <DeviationBar
                            deviation_percent={result.deviation_percent}
                            is_above={result.is_above_category_average}
                        />

                        {/* Summary */}
                        <div className="bg-gray-800/60 rounded-lg p-3">
                            <div className="text-xs text-gray-500
                                            uppercase tracking-wider
                                            font-medium mb-1.5">
                                Summary
                            </div>
                            <p className="text-gray-200 text-sm
                                         leading-relaxed">
                                {result.summary}
                            </p>
                        </div>

                        {/* Historical context */}
                        <div className="bg-gray-800/60 rounded-lg p-3">
                            <div className="text-xs text-gray-500
                                            uppercase tracking-wider
                                            font-medium mb-1.5">
                                Historical Context
                            </div>
                            <p className="text-gray-300 text-xs
                                         leading-relaxed">
                                {result.historical_context}
                            </p>
                        </div>

                        {/* Financial flags */}
                        {result.flags?.length > 0 && (
                            <div className="bg-red-500/5 border
                                            border-red-500/15 rounded-lg p-3">
                                <div className="text-xs text-red-400
                                                font-medium mb-2
                                                flex items-center gap-1">
                                    <AlertTriangle size={11} />
                                    Financial Flags
                                </div>
                                <ul className="space-y-1.5">
                                    {result.flags.map((flag, i) => (
                                        <li key={i}
                                            className="text-xs text-gray-300
                                                       flex items-start gap-2">
                                            <span className="text-red-400
                                                             mt-0.5 shrink-0">
                                                ⚠
                                            </span>
                                            {flag}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Suggested finance note */}
                        <div className="bg-gray-800/60 rounded-lg p-3">
                            <div className="flex items-center
                                            justify-between mb-2">
                                <div className="text-xs text-gray-500
                                                uppercase tracking-wider
                                                font-medium">
                                    Suggested Finance Note
                                </div>
                                <div className="flex gap-2">
                                    <CopyButton
                                        text={result.suggested_finance_note}
                                    />
                                    <button
                                        onClick={handleUseNote}
                                        className="flex items-center gap-1
                                                   px-2 py-1 text-xs
                                                   text-blue-400
                                                   hover:text-blue-300
                                                   border border-blue-500/20
                                                   hover:border-blue-500/40
                                                   rounded transition-colors"
                                    >
                                        {uiConfig.actionText}
                                    </button>
                                </div>
                            </div>
                            <p className="text-gray-300 text-xs
                                         leading-relaxed italic">
                                "{result.suggested_finance_note}"
                            </p>
                        </div>

                        {/* Regenerate */}
                        <button
                            onClick={fetchAnalysis}
                            className="text-xs text-gray-500
                                       hover:text-gray-300 transition-colors
                                       flex items-center gap-1"
                        >
                            <Sparkles size={11} />
                            Regenerate analysis
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}