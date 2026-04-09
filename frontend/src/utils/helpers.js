export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

export const formatDateTime = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const timeAgo = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now - date) / 1000)
  
  let interval = seconds / 31536000
  if (interval > 1) return Math.floor(interval) + ' years ago'
  
  interval = seconds / 2592000
  if (interval > 1) return Math.floor(interval) + ' months ago'
  
  interval = seconds / 86400
  if (interval > 1) return Math.floor(interval) + ' days ago'
  
  interval = seconds / 3600
  if (interval > 1) return Math.floor(interval) + ' hours ago'
  
  interval = seconds / 60
  if (interval > 1) return Math.floor(interval) + ' minutes ago'
  
  return 'Just now'
}

export const getStageBadgeColor = (stage) => {
  const colors = {
    draft: "bg-gray-600 text-gray-100",
    submitted: "bg-blue-600 text-blue-100",
    dept_review: "bg-yellow-600 text-yellow-100",
    finance_review: "bg-orange-600 text-orange-100",
    procurement: "bg-purple-600 text-purple-100",
    approved: "bg-green-600 text-green-100",
    rejected: "bg-red-600 text-red-100"
  }
  return colors[stage] || "bg-gray-600 text-gray-100"
}

export const getPriorityColor = (score) => {
  if (score >= 1 && score <= 3) return "text-green-400"
  if (score >= 4 && score <= 6) return "text-yellow-400"
  if (score >= 7 && score <= 10) return "text-red-400"
  return "text-gray-400"
}

export const getStageLabel = (stage) => {
  const labels = {
    draft: "Draft",
    submitted: "Submitted",
    dept_review: "Dept Review",
    finance_review: "Finance Review",
    procurement: "Procurement",
    approved: "Approved",
    rejected: "Rejected"
  }
  return labels[stage] || stage
}

export const canApprove = (userRole, stage) => {
  const stageRoleMap = {
    submitted: "dept_head",
    dept_review: "dept_head",
    finance_review: "finance",
    procurement: "admin"
  }
  return stageRoleMap[stage] === userRole
}

export const isOverSLA = (sla_deadline) => {
  if (!sla_deadline) return false
  return new Date(sla_deadline) < new Date()
}
