// frontend/src/components/dashboard/BottleneckDetector.jsx

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
    Sparkles, AlertTriangle, CheckCircle, AlertCircle,
    Loader2, RefreshCw, ChevronDown, ChevronUp,
    ArrowRight, Zap, Clock, TrendingUp
} from "lucide-react"
import api from "../../api/axios"

// ── Health Status Banner ──────────────────────────────────────────
function HealthBanner({ health, label, reason }) {
    const config = {
        healthy: {
            style: "bg-green-500/10 border-green-500/25 text-green-400",
            icon: <CheckCircle size={16} />,
            bar: "bg-green-500"
        },
        warning: {
            style: "bg-yellow-500/10 border-yellow-500/25 text-yellow-400",
            icon: <AlertTriangle size={16} />,
            bar: "bg-yellow-500"
        },
        critical: {
            style: "bg-red-500/10 border-red-500/25 text-red-400",
            icon: <AlertCircle size={16} />,
            bar: "bg-red-500"
        }
    }
    const c = config[health] || config.warning

    return (
        <div className={`flex items-start gap-3 p-4 rounded-xl border
                        ${c.style}`}>
            <div className="mt-0.5 shrink-0">{c.icon}</div>
            <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{label}</div>
                <div className="text-xs mt-0.5 opacity-75 leading-relaxed">
                    {reason}
                </div>
            </div>
        </div>
    )
}

// ── Severity Badge ────────────────────────────────────────────────
function SeverityBadge({ severity }) {
    const config = {
        high: "bg-red-500/15 text-red-400 border-red-500/25",
        medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
        low: "bg-blue-500/15 text-blue-400 border-blue-500/25"
    }
    return (
        <span className={`px-2 py-0.5 text-xs font-semibold
                         rounded-full border uppercase tracking-wide
                         ${config[severity] || config.medium}`}>
            {severity}
        </span>
    )
}

// ── Single Bottleneck Card ────────────────────────────────────────
function BottleneckCard({ bottleneck, index }) {
    const [expanded, setExpanded] = useState(
        bottleneck.severity === "high"
    )

    const stageLabel = {
        submitted: "Submitted",
        dept_review: "Dept Review",
        finance_review: "Finance Review",
        procurement: "Procurement"
    }

    const formatCurrency = (amount) =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }).format(amount)

    return (
        <div className={`border rounded-xl overflow-hidden transition-all
                        duration-200
                        ${bottleneck.severity === "high"
                            ? "border-red-500/30 bg-red-500/5"
                            : bottleneck.severity === "medium"
                            ? "border-yellow-500/20 bg-yellow-500/5"
                            : "border-blue-500/20 bg-blue-500/5"
                        }`}>

            {/* Card Header */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-start justify-between
                           p-4 text-left hover:bg-white/3
                           transition-colors"
            >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Index number */}
                    <div className={`shrink-0 w-6 h-6 rounded-full
                                    flex items-center justify-center
                                    text-xs font-bold mt-0.5
                                    ${bottleneck.severity === "high"
                                        ? "bg-red-500/20 text-red-400"
                                        : bottleneck.severity === "medium"
                                        ? "bg-yellow-500/20 text-yellow-400"
                                        : "bg-blue-500/20 text-blue-400"
                                    }`}>
                        {index + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                        {/* Title row */}
                        <div className="flex items-center gap-2
                                        flex-wrap">
                            <span className="text-white font-semibold
                                             text-sm">
                                {bottleneck.title}
                            </span>
                            <SeverityBadge severity={bottleneck.severity} />
                        </div>

                        {/* Meta row */}
                        <div className="flex items-center gap-3 mt-1
                                        flex-wrap">
                            <span className="text-xs text-gray-500
                                             flex items-center gap-1">
                                <Clock size={10} />
                                {stageLabel[bottleneck.stage]
                                    || bottleneck.stage}
                            </span>
                            <span className="text-xs text-gray-500">
                                {bottleneck.affected_count} item
                                {bottleneck.affected_count !== 1
                                    ? "s" : ""}
                            </span>
                            {bottleneck.affected_value > 0 && (
                                <span className="text-xs text-gray-500">
                                    {formatCurrency(
                                        bottleneck.affected_value
                                    )}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="shrink-0 ml-2 text-gray-500">
                    {expanded
                        ? <ChevronUp size={15} />
                        : <ChevronDown size={15} />
                    }
                </div>
            </button>

            {/* Expanded Content */}
            {expanded && (
                <div className="px-4 pb-4 space-y-3 border-t
                                border-white/5 pt-3">

                    {/* Description */}
                    <p className="text-sm text-gray-300 leading-relaxed">
                        {bottleneck.description}
                    </p>

                    {/* Likely cause */}
                    <div className="flex items-start gap-2 p-3
                                    bg-gray-800/60 rounded-lg">
                        <TrendingUp size={13}
                            className="text-gray-400 mt-0.5 shrink-0" />
                        <div>
                            <div className="text-xs text-gray-500
                                            font-medium mb-0.5
                                            uppercase tracking-wide">
                                Likely Cause
                            </div>
                            <p className="text-xs text-gray-300
                                         leading-relaxed">
                                {bottleneck.likely_cause}
                            </p>
                        </div>
                    </div>

                    {/* Recommended action */}
                    <div className={`flex items-start gap-2 p-3
                                    rounded-lg
                                    ${bottleneck.severity === "high"
                                        ? "bg-red-500/10 border border-red-500/20"
                                        : "bg-blue-500/10 border border-blue-500/20"
                                    }`}>
                        <ArrowRight size={13}
                            className={`mt-0.5 shrink-0
                                       ${bottleneck.severity === "high"
                                           ? "text-red-400"
                                           : "text-blue-400"}`} />
                        <div>
                            <div className={`text-xs font-semibold
                                            mb-0.5 uppercase tracking-wide
                                            ${bottleneck.severity === "high"
                                                ? "text-red-400"
                                                : "text-blue-400"}`}>
                                Recommended Action
                            </div>
                            <p className="text-xs text-gray-200
                                         leading-relaxed">
                                {bottleneck.recommended_action}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// ── Summary Stats Row ─────────────────────────────────────────────
function SummaryStats({ stats }) {
    const formatCurrency = (amount) =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }).format(amount)

    const stageLabel = {
        submitted: "Submitted",
        dept_review: "Dept Review",
        finance_review: "Finance Review",
        procurement: "Procurement"
    }

    return (
        <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">
                    Total Stuck
                </div>
                <div className="text-white font-bold text-lg">
                    {stats.total_stuck}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                    {formatCurrency(stats.total_stuck_value)}
                </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">
                    Most Congested
                </div>
                <div className="text-white font-bold text-sm leading-tight">
                    {stageLabel[stats.most_congested_stage]
                        || stats.most_congested_stage
                        || "None"}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                    stage
                </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">
                    Oldest Pending
                </div>
                <div className="text-white font-bold text-lg">
                    {stats.oldest_pending_days}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                    days
                </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">
                    Bottlenecks Found
                </div>
                <div className="text-white font-bold text-lg">
                    {stats.total_stuck > 0 ? "Yes" : "None"}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                    detected
                </div>
            </div>
        </div>
    )
}

// ── Main Component ────────────────────────────────────────────────
export default function BottleneckDetector() {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [data, setData] = useState(null)
    const [collapsed, setCollapsed] = useState(false)
    const [lastUpdated, setLastUpdated] = useState(null)
    const navigate = useNavigate()

    const fetchBottlenecks = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await api.get(
                "/ai/assistant/bottleneck-detection"
            )
            setData(res.data)
            setLastUpdated(new Date())
        } catch (err) {
            // If 403 — user is not admin, silently hide
            if (err.response?.status === 403) {
                setData(null)
                return
            }
            setError(
                err.response?.data?.detail ||
                "Bottleneck detection temporarily unavailable."
            )
        } finally {
            setLoading(false)
        }
    }

    // Auto-load on mount
    useEffect(() => {
        fetchBottlenecks()
    }, [])

    // If not admin or no data — render nothing
    if (!loading && !error && !data) return null

    // Sort bottlenecks: high first, then medium, then low
    const sortedBottlenecks = data?.bottlenecks
        ? [...data.bottlenecks].sort((a, b) => {
            const order = { high: 0, medium: 1, low: 2 }
            return (order[a.severity] ?? 1) - (order[b.severity] ?? 1)
        })
        : []

    const highCount = sortedBottlenecks.filter(
        b => b.severity === "high"
    ).length

    return (
        <div className="bg-gray-900 border border-white/10
                        rounded-xl overflow-hidden">

            {/* ── Header ─────────────────────────────────────────── */}
            <div className="flex items-center justify-between
                            px-5 py-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg
                                    ${data?.overall_health === "critical"
                                        ? "bg-red-500/10"
                                        : data?.overall_health === "warning"
                                        ? "bg-yellow-500/10"
                                        : "bg-green-500/10"}`}>
                        <Sparkles size={15}
                            className={
                                data?.overall_health === "critical"
                                    ? "text-red-400"
                                    : data?.overall_health === "warning"
                                    ? "text-yellow-400"
                                    : "text-green-400"
                            }
                        />
                    </div>
                    <div>
                        <div className="text-white font-semibold text-sm
                                        flex items-center gap-2">
                            AI Bottleneck Detector
                            {highCount > 0 && (
                                <span className="px-1.5 py-0.5 bg-red-500
                                                 text-white text-xs
                                                 font-bold rounded-full">
                                    {highCount}
                                </span>
                            )}
                        </div>
                        <div className="text-gray-400 text-xs mt-0.5">
                            {lastUpdated
                                ? `Last analysed at ${lastUpdated
                                    .toLocaleTimeString()}`
                                : "Analysing pipeline..."
                            }
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Refresh button */}
                    <button
                        onClick={fetchBottlenecks}
                        disabled={loading}
                        className="p-1.5 hover:bg-white/5 rounded-lg
                                   text-gray-400 hover:text-white
                                   transition-colors disabled:opacity-40"
                        title="Refresh analysis"
                    >
                        <RefreshCw size={14}
                            className={loading ? "animate-spin" : ""} />
                    </button>

                    {/* Collapse toggle */}
                    {!loading && data && (
                        <button
                            onClick={() => setCollapsed(!collapsed)}
                            className="p-1.5 hover:bg-white/5 rounded-lg
                                       text-gray-400 hover:text-white
                                       transition-colors"
                        >
                            {collapsed
                                ? <ChevronDown size={14} />
                                : <ChevronUp size={14} />
                            }
                        </button>
                    )}
                </div>
            </div>

            {/* ── Body ───────────────────────────────────────────── */}
            {!collapsed && (
                <div className="px-5 py-4 space-y-4">

                    {/* Loading state */}
                    {loading && (
                        <div className="flex items-center gap-3 py-6
                                        justify-center">
                            <Loader2 size={18}
                                className="animate-spin text-blue-400" />
                            <span className="text-gray-400 text-sm">
                                Analysing pipeline for bottlenecks...
                            </span>
                        </div>
                    )}

                    {/* Error state */}
                    {error && !loading && (
                        <div className="flex items-start gap-2 p-3
                                        bg-red-500/10 border
                                        border-red-500/20 rounded-lg">
                            <AlertCircle size={15}
                                className="text-red-400 mt-0.5 shrink-0" />
                            <div>
                                <div className="text-red-400 text-sm
                                                font-medium">
                                    Analysis Failed
                                </div>
                                <div className="text-red-300/70 text-xs mt-0.5">
                                    {error}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Results */}
                    {data && !loading && (
                        <>
                            {/* Health banner */}
                            <HealthBanner
                                health={data.overall_health}
                                label={data.health_label}
                                reason={data.health_reason}
                            />

                            {/* Summary stats */}
                            {data.summary_stats && (
                                <SummaryStats
                                    stats={data.summary_stats} />
                            )}

                            {/* Bottleneck cards */}
                            {sortedBottlenecks.length > 0 ? (
                                <div className="space-y-3">
                                    <div className="text-xs text-gray-500
                                                    uppercase tracking-wider
                                                    font-medium">
                                        {sortedBottlenecks.length} Bottleneck
                                        {sortedBottlenecks.length !== 1
                                            ? "s" : ""} Detected
                                    </div>
                                    {sortedBottlenecks.map((b, i) => (
                                        <BottleneckCard
                                            key={b.id || i}
                                            bottleneck={b}
                                            index={i}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex items-center
                                                justify-center gap-2
                                                py-4 text-green-400 text-sm">
                                    <CheckCircle size={16} />
                                    No bottlenecks detected —
                                    pipeline is flowing smoothly
                                </div>
                            )}

                            {/* Quick wins */}
                            {data.quick_wins?.length > 0 && (
                                <div className="border border-white/8
                                                rounded-lg p-4">
                                    <div className="flex items-center
                                                    gap-2 mb-3">
                                        <Zap size={13}
                                            className="text-yellow-400" />
                                        <span className="text-xs
                                                         text-yellow-400
                                                         font-semibold
                                                         uppercase
                                                         tracking-wider">
                                            Quick Wins
                                        </span>
                                    </div>
                                    <ul className="space-y-2">
                                        {data.quick_wins.map((win, i) => (
                                            <li key={i}
                                                className="flex items-start
                                                           gap-2 text-xs
                                                           text-gray-300">
                                                <span className="text-yellow-500
                                                                 mt-0.5
                                                                 shrink-0">
                                                    →
                                                </span>
                                                {win}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Go to pipeline link */}
                            <button
                                onClick={() => navigate("/pipeline")}
                                className="flex items-center gap-1.5
                                           text-xs text-blue-400
                                           hover:text-blue-300
                                           transition-colors"
                            >
                                <ArrowRight size={12} />
                                View full pipeline to take action
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}