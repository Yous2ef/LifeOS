import {
    format,
    formatDistanceToNow,
    isToday,
    isTomorrow,
    isPast,
    addDays,
} from "date-fns";

// Generate unique ID
export const generateId = (): string => {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// Format date utilities
export const formatDate = (date: string | Date | undefined | null): string => {
    if (!date) return "No date set";
    try {
        return format(new Date(date), "MMM dd, yyyy");
    } catch {
        return "Invalid date";
    }
};

// Format date with relative labels (Today, Tomorrow)
export const formatDateRelative = (date: string | Date): string => {
    const dateObj = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dateObj.toDateString() === today.toDateString()) return "Today";
    if (dateObj.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    return dateObj.toLocaleDateString();
};

export const formatDateTime = (
    date: string | Date | undefined | null
): string => {
    if (!date) return "No date set";
    try {
        return format(new Date(date), "MMM dd, yyyy HH:mm");
    } catch {
        return "Invalid date";
    }
};

export const formatTime = (date: string | Date | undefined | null): string => {
    if (!date) return "No time set";
    try {
        return format(new Date(date), "HH:mm");
    } catch {
        return "Invalid time";
    }
};

export const getRelativeTime = (date: string | Date): string => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
};

// Date checking utilities
export const isDateToday = (date: string | Date): boolean => {
    return isToday(new Date(date));
};

export const isDateTomorrow = (date: string | Date): boolean => {
    return isTomorrow(new Date(date));
};

export const isDatePast = (date: string | Date): boolean => {
    return isPast(new Date(date));
};

export const getDaysUntil = (date: string | Date): number => {
    const now = new Date();
    const target = new Date(date);
    const diffTime = target.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const addDaysToDate = (date: string | Date, days: number): Date => {
    return addDays(new Date(date), days);
};

// Get greeting based on time
export const getGreeting = (): string => {
    const hour = new Date().getHours();

    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
};

// Get motivational quote
const quotes = [
    "The secret of getting ahead is getting started.",
    "Success is the sum of small efforts repeated day in and day out.",
    "Don't watch the clock; do what it does. Keep going.",
    "The future depends on what you do today.",
    "Believe you can and you're halfway there.",
    "Your limitation—it's only your imagination.",
    "Great things never come from comfort zones.",
    "Dream it. Wish it. Do it.",
    "Success doesn't just find you. You have to go out and get it.",
    "The harder you work for something, the greater you'll feel when you achieve it.",
    "Don't stop when you're tired. Stop when you're done.",
    "Do something today that your future self will thank you for.",
    "Little things make big days.",
    "It's going to be hard, but hard does not mean impossible.",
    "Don't wait for opportunity. Create it.",
    "Sometimes we're tested not to show our weaknesses, but to discover our strengths.",
    "The key to success is to focus on goals, not obstacles.",
    "Dream bigger. Do bigger.",
    "Don't tell people your plans. Show them your results.",
    "Work hard in silence, let your success be the noise.",
];

export const getRandomQuote = (): string => {
    return quotes[Math.floor(Math.random() * quotes.length)];
};

// Calculate GPA
export const calculateGPA = (grades: number[], credits: number[]): number => {
    if (grades.length === 0 || grades.length !== credits.length) return 0;

    let totalPoints = 0;
    let totalCredits = 0;

    grades.forEach((grade, index) => {
        totalPoints += grade * credits[index];
        totalCredits += credits[index];
    });

    return totalCredits > 0 ? totalPoints / totalCredits : 0;
};

// Format time in minutes to readable format
export const formatMinutesToTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

// Calculate percentage
export const calculatePercentage = (
    completed: number,
    total: number
): number => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
};

// Get priority color for string-based priorities
export const getPriorityTextColor = (
    priority: "low" | "medium" | "high"
): string => {
    switch (priority) {
        case "high":
            return "text-red-500";
        case "medium":
            return "text-yellow-500";
        case "low":
            return "text-green-500";
        default:
            return "text-gray-500";
    }
};

// Get priority color for numeric priorities (returns badge variant)
// Low priority (1-4) → success (green)
// Medium priority (5-7) → warning (yellow)
// High priority (8-9) → danger (orange/red)
// Critical priority (10) → destructive (bright red)
export const getPriorityColor = (
    priority: number
): "success" | "warning" | "danger" | "destructive" => {
    if (priority >= 10) return "destructive"; // Critical - bright red
    if (priority >= 8) return "danger"; // High - red
    if (priority >= 5) return "warning"; // Medium - yellow
    return "success"; // Low - green
};

// Get status color
export const getStatusColor = (status: string): string => {
    switch (status) {
        case "completed":
        case "done":
        case "paid":
        case "accepted":
            return "bg-green-500/20 text-green-400 border-green-500/30";
        case "in-progress":
        case "interview":
            return "bg-blue-500/20 text-blue-400 border-blue-500/30";
        case "todo":
        case "not-started":
        case "planning":
        case "interested":
            return "bg-gray-500/20 text-gray-400 border-gray-500/30";
        case "rejected":
        case "on-hold":
            return "bg-red-500/20 text-red-400 border-red-500/30";
        case "applied":
            return "bg-purple-500/20 text-purple-400 border-purple-500/30";
        case "review":
            return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
        default:
            return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
};

// Truncate text
export const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
};

// Format currency
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(amount);
};

// Search filter utility
export const searchFilter = (item: any, searchTerm: string): boolean => {
    if (!searchTerm) return true;

    const term = searchTerm.toLowerCase();
    const searchableText = JSON.stringify(item).toLowerCase();

    return searchableText.includes(term);
};

// Sort utility
export const sortByDate = <
    T extends { createdAt?: string; date?: string; dueDate?: string }
>(
    items: T[],
    field: "createdAt" | "date" | "dueDate" = "createdAt",
    ascending: boolean = false
): T[] => {
    return [...items].sort((a, b) => {
        const dateA = new Date(a[field] || 0).getTime();
        const dateB = new Date(b[field] || 0).getTime();
        return ascending ? dateA - dateB : dateB - dateA;
    });
};

// Get initials from name
export const getInitials = (name: string): string => {
    return name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);
};

// Get priority color for house tasks (string-based priority)
export const getHousePriorityColor = (
    priority: "low" | "medium" | "high"
): string => {
    switch (priority) {
        case "high":
            return "bg-red-500/10 text-red-500";
        case "medium":
            return "bg-yellow-500/10 text-yellow-500";
        case "low":
            return "bg-green-500/10 text-green-500";
        default:
            return "bg-gray-500/10 text-gray-500";
    }
};

// Class name utility
export const cn = (...classes: (string | boolean | undefined)[]): string => {
    return classes.filter(Boolean).join(" ");
};
