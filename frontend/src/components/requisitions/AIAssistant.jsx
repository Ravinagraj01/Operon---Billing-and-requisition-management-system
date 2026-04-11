// frontend/src/components/requisitions/AIAssistant.jsx

import { useState, useRef, useEffect } from "react"
import {
    Sparkles, Send, Loader2, AlertCircle,
    CheckCircle, Info, ChevronDown, ChevronUp,
    Wand2, X, RefreshCw
} from "lucide-react"
import api from "../../api/axios"

// ── Confidence Badge ──────────────────────────────────────────────────────────
function ConfidenceBadge({ confidence }) {
    const config = {
        high: {
            style: "bg-green-500/10 text-green-400 border-green-500/20",
            icon: <CheckCircle size={11} />,
            label: "High Confidence"
        },
        medium: {
            style: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
            icon: <Info size={11} />,
            label: "Medium Confidence"
        },
        low: {
            style: "bg-red-500/10 text-red-400 border-red-500/20",
            icon: <AlertCircle size={11} />,
            label: "Low Confidence — Review Carefully"
        }
    }

    const c = config[confidence] || config.medium

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5
                         text-xs border rounded-full font-medium ${c.style}`}>
            {c.icon}
            {c.label}
        </span>
    )
}

// ── Single Extracted Field ────────────────────────────────────────────────────
function ExtractedField({ label, value, isAmount, highlight }) {
    if (value === null || value === undefined || value === "") return null

    const displayValue = isAmount
        ? new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
          }).format(value)
        : String(value)

    return (
        <div className={`flex flex-col gap-1 p-3 rounded-lg
                        ${highlight
                            ? "bg-blue-500/5 border border-blue-500/20"
                            : "bg-gray-800/50"}`}>
            <span className="text-xs text-gray-500 uppercase
                             tracking-wider font-medium">
                {label}
            </span>
            <span className="text-sm text-white leading-relaxed">
                {displayValue}
            </span>
        </div>
    )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AIAssistant({ onFillForm }) {
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [result, setResult] = useState(null)
    const [collapsed, setCollapsed] = useState(false)
    const [applied, setApplied] = useState(false)
    const textareaRef = useRef(null)

    const EXAMPLE_PROMPTS = [
        "5 Dell laptops for developers joining next month, 80k each",
        "Legal consultation for reviewing vendor contracts, budget 1.5 lakh",
        "Annual Figma subscription for design team of 6 people",
        "Security audit for cloud infrastructure from certified firm",
        "Office chairs for 10 employees, around 8000 each"
    ]

    // Auto resize textarea as user types
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto"
            textareaRef.current.style.height =
                Math.min(textareaRef.current.scrollHeight, 160) + "px"
        }
    }, [input])

    const handleSubmit = async () => {
        if (!input.trim() || loading) return

        setLoading(true)
        setError(null)
        setResult(null)
        setApplied(false)

        try {
            const res = await api.post("/ai/assistant/requisition", {
                text: input.trim()
            })
            setResult(res.data)
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                "Something went wrong. Please try again or fill the form manually."
            )
        } finally {
            setLoading(false)
        }
    }

    const handleKeyDown = (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault()
            handleSubmit()
        }
    }

    const handleApply = () => {
        if (!result) return
        onFillForm(result)
        setApplied(true)
        // Scroll to form after applying
        setTimeout(() => {
            document.getElementById("requisition-form")?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            })
        }, 100)
    }

    const handleReset = () => {
        setInput("")
        setResult(null)
        setError(null)
        setApplied(false)
        textareaRef.current?.focus()
    }

    const handleExampleClick = (prompt) => {
        setInput(prompt)
        setResult(null)
        setError(null)
        setApplied(false)
        textareaRef.current?.focus()
    }

    return (
        <div className="bg-gray-900 border border-blue-500/20
                        rounded-xl overflow-hidden">

            {/* ── Header ───────────────────────────────────────────── */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="w-full flex items-center justify-between
                           px-5 py-4 hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-blue-500/10 rounded-lg">
                        <Sparkles size={16} className="text-blue-400" />
                    </div>
                    <div className="text-left">
                        <div className="text-white font-semibold text-sm">
                            AI Requisition Assistant
                        </div>
                        <div className="text-gray-400 text-xs mt-0.5">
                            Describe what you need in plain English —
                            AI fills the form for you
                        </div>
                    </div>
                    <span className="ml-2 px-2 py-0.5 bg-blue-500/10
                                     text-blue-400 text-xs rounded-full
                                     border border-blue-500/20 font-medium">
                        Powered by Groq
                    </span>
                </div>
                {collapsed
                    ? <ChevronDown size={16} className="text-gray-400" />
                    : <ChevronUp size={16} className="text-gray-400" />
                }
            </button>

            {/* ── Body ─────────────────────────────────────────────── */}
            {!collapsed && (
                <div className="px-5 pb-5 space-y-4 border-t border-white/5">

                    {/* How it works hint */}
                    <div className="flex items-center gap-2 pt-4">
                        <Info size={13} className="text-gray-500 shrink-0" />
                        <span className="text-xs text-gray-500">
                            Type what you need naturally. The AI will extract
                            a professional requisition. You can edit any field
                            before submitting.
                            <span className="text-gray-600 ml-1">
                                Press Ctrl+Enter to generate.
                            </span>
                        </span>
                    </div>

                    {/* Input textarea */}
                    <div className="relative">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={
                                "e.g. I need 5 Dell laptops for new developers " +
                                "joining next month, around 80k each..."
                            }
                            rows={3}
                            maxLength={1000}
                            className="w-full bg-gray-800 border border-white/10
                                       rounded-lg px-4 py-3 pr-16 text-white
                                       text-sm placeholder-gray-500 resize-none
                                       focus:outline-none focus:border-blue-500/60
                                       transition-colors leading-relaxed"
                            disabled={loading}
                        />
                        <div className={`absolute bottom-3 right-3 text-xs
                                        ${input.length > 900
                                            ? "text-yellow-500"
                                            : "text-gray-600"}`}>
                            {input.length}/1000
                        </div>
                    </div>

                    {/* Example prompts */}
                    {!result && (
                        <div>
                            <div className="text-xs text-gray-500 mb-2 font-medium">
                                Quick examples — click to try:
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {EXAMPLE_PROMPTS.map((prompt, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleExampleClick(prompt)}
                                        disabled={loading}
                                        className="text-xs px-3 py-1.5 bg-gray-800
                                                   border border-white/10 rounded-full
                                                   text-gray-400 hover:text-white
                                                   hover:border-blue-500/40
                                                   disabled:opacity-40
                                                   transition-colors text-left"
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Generate button */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleSubmit}
                            disabled={!input.trim() || loading}
                            className="flex items-center gap-2 px-5 py-2.5
                                       bg-blue-600 hover:bg-blue-500
                                       disabled:bg-gray-700
                                       disabled:cursor-not-allowed
                                       text-white text-sm font-semibold
                                       rounded-lg transition-colors"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={15} className="animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Send size={15} />
                                    Generate Requisition
                                </>
                            )}
                        </button>

                        {(result || error) && (
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-2 px-4 py-2.5
                                           border border-white/10 hover:bg-white/5
                                           text-gray-400 hover:text-white
                                           text-sm rounded-lg transition-colors"
                            >
                                <RefreshCw size={14} />
                                Reset
                            </button>
                        )}
                    </div>

                    {/* ── Error State ──────────────────────────────── */}
                    {error && (
                        <div className="flex items-start gap-3 p-4
                                        bg-red-500/8 border border-red-500/20
                                        rounded-lg">
                            <AlertCircle size={16}
                                className="text-red-400 mt-0.5 shrink-0" />
                            <div>
                                <div className="text-red-400 text-sm font-medium mb-0.5">
                                    Generation Failed
                                </div>
                                <div className="text-red-300/70 text-xs">
                                    {error}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Result Panel ─────────────────────────────── */}
                    {result && (
                        <div className="border border-white/10 rounded-xl
                                        overflow-hidden">

                            {/* Result header */}
                            <div className="flex items-center justify-between
                                            px-4 py-3 bg-gray-800 border-b
                                            border-white/5">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <div className="flex items-center gap-1.5">
                                        <CheckCircle size={14}
                                            className="text-green-400" />
                                        <span className="text-white text-sm
                                                         font-semibold">
                                            Requisition Extracted
                                        </span>
                                    </div>
                                    <ConfidenceBadge
                                        confidence={result.confidence} />
                                </div>
                                <button
                                    onClick={handleReset}
                                    className="p-1.5 hover:bg-white/10 rounded-lg
                                               text-gray-400 hover:text-white
                                               transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            </div>

                            {/* Clarification warning banner */}
                            {result.clarification_needed && (
                                <div className="flex items-start gap-3 px-4 py-3
                                                bg-yellow-500/5 border-b
                                                border-yellow-500/15">
                                    <Info size={14}
                                        className="text-yellow-400 mt-0.5 shrink-0" />
                                    <div>
                                        <div className="text-yellow-400 text-xs
                                                        font-semibold mb-0.5">
                                            One thing to clarify
                                        </div>
                                        <div className="text-yellow-300/75 text-xs
                                                        leading-relaxed">
                                            {result.clarification_needed}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Extracted fields grid */}
                            <div className="p-4 space-y-3">
                                <ExtractedField
                                    label="Title"
                                    value={result.title}
                                    highlight={true} />

                                <div className="grid grid-cols-2 gap-3">
                                    <ExtractedField
                                        label="Category"
                                        value={result.category} />
                                    <ExtractedField
                                        label="Estimated Amount"
                                        value={result.amount}
                                        isAmount={true} />
                                </div>

                                {result.vendor_suggestion && (
                                    <ExtractedField
                                        label="Vendor Suggestion"
                                        value={result.vendor_suggestion} />
                                )}

                                <ExtractedField
                                    label="Description"
                                    value={result.description} />

                                {/* Fields with null values warning */}
                                {(!result.amount || !result.vendor_suggestion) && (
                                    <div className="flex items-center gap-2">
                                        <Info size={12}
                                            className="text-gray-500 shrink-0" />
                                        <span className="text-xs text-gray-500">
                                            {!result.amount && "Amount was not detected — please enter it manually."}
                                            {!result.amount && !result.vendor_suggestion && " "}
                                            {!result.vendor_suggestion && "No specific vendor was identified."}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Apply button area */}
                            <div className="px-4 pb-4">
                                {applied ? (
                                    <div className="flex items-center gap-2
                                                    p-3 bg-green-500/10
                                                    border border-green-500/20
                                                    rounded-lg">
                                        <CheckCircle size={15}
                                            className="text-green-400 shrink-0" />
                                        <span className="text-green-400 text-sm">
                                            Form filled successfully.
                                            Review and edit any fields
                                            below before submitting.
                                        </span>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleApply}
                                        className="flex items-center justify-center
                                                   gap-2 w-full px-4 py-3
                                                   bg-green-600 hover:bg-green-500
                                                   text-white text-sm font-semibold
                                                   rounded-lg transition-colors"
                                    >
                                        <Wand2 size={15} />
                                        Apply to Form
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
