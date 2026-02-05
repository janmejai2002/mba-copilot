// Spaced Repetition System (SRS) Service
// Implements SM-2 algorithm for optimal review scheduling

export interface SRSItem {
    id: string;
    easeFactor: number;      // 1.3 to 2.5+ (difficulty multiplier)
    interval: number;        // Days until next review
    repetitions: number;     // Number of successful reviews
    lastReview: number;      // Timestamp of last review
    nextReview: number;      // Timestamp of next scheduled review
    mastery: number;         // 0-1 mastery score
}

export interface ReviewResult {
    quality: 0 | 1 | 2 | 3 | 4 | 5; // 0=blackout, 5=perfect recall
}

// SM-2 quality ratings
export const QUALITY_LABELS: Record<number, string> = {
    0: 'Complete Blackout',
    1: 'Incorrect, but recognized',
    2: 'Incorrect, easy to recall',
    3: 'Correct, with difficulty',
    4: 'Correct, with hesitation',
    5: 'Perfect recall'
};

/**
 * Calculate next review using SM-2 algorithm
 */
export const calculateNextReview = (item: SRSItem, quality: number): SRSItem => {
    let { easeFactor, interval, repetitions } = item;

    // Update ease factor (minimum 1.3)
    easeFactor = Math.max(
        1.3,
        easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    );

    if (quality < 3) {
        // Failed review: reset to beginning
        repetitions = 0;
        interval = 1;
    } else {
        // Successful review
        repetitions += 1;

        if (repetitions === 1) {
            interval = 1;
        } else if (repetitions === 2) {
            interval = 6;
        } else {
            interval = Math.round(interval * easeFactor);
        }
    }

    const now = Date.now();
    const nextReview = now + interval * 24 * 60 * 60 * 1000;

    // Calculate mastery (0-1 based on repetitions and ease)
    const mastery = Math.min(1, (repetitions * 0.15) + ((easeFactor - 1.3) / 2));

    return {
        ...item,
        easeFactor,
        interval,
        repetitions,
        lastReview: now,
        nextReview,
        mastery
    };
};

/**
 * Create a new SRS item with default values
 */
export const createSRSItem = (id: string): SRSItem => ({
    id,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    lastReview: 0,
    nextReview: Date.now(), // Due immediately
    mastery: 0
});

/**
 * Check if an item is due for review
 */
export const isDue = (item: SRSItem): boolean => {
    return Date.now() >= item.nextReview;
};

/**
 * Get items due for review, sorted by urgency
 */
export const getDueItems = (items: SRSItem[]): SRSItem[] => {
    const now = Date.now();
    return items
        .filter(item => item.nextReview <= now)
        .sort((a, b) => a.nextReview - b.nextReview); // Most overdue first
};

/**
 * Get items that will be due within a time window
 */
export const getUpcomingReviews = (items: SRSItem[], withinHours: number = 24): SRSItem[] => {
    const now = Date.now();
    const windowEnd = now + withinHours * 60 * 60 * 1000;

    return items
        .filter(item => item.nextReview > now && item.nextReview <= windowEnd)
        .sort((a, b) => a.nextReview - b.nextReview);
};

/**
 * Calculate mastery decay (for visual effect)
 * Returns a value 0-1 representing current "remembered" state
 */
export const calculateDecay = (item: SRSItem): number => {
    if (item.lastReview === 0) return 0;

    const now = Date.now();
    const timeSinceReview = now - item.lastReview;
    const expectedInterval = item.interval * 24 * 60 * 60 * 1000;

    if (expectedInterval === 0) return item.mastery;

    // Exponential decay based on how overdue the item is
    const overdueRatio = timeSinceReview / expectedInterval;
    const decayFactor = Math.exp(-0.5 * Math.max(0, overdueRatio - 1));

    return item.mastery * decayFactor;
};

/**
 * Get mastery level category
 */
export const getMasteryLevel = (mastery: number): {
    level: 'new' | 'learning' | 'reviewing' | 'mastered';
    color: string;
    label: string;
} => {
    if (mastery === 0) {
        return { level: 'new', color: '#6b7280', label: 'New' };
    } else if (mastery < 0.3) {
        return { level: 'learning', color: '#ef4444', label: 'Learning' };
    } else if (mastery < 0.7) {
        return { level: 'reviewing', color: '#f59e0b', label: 'Reviewing' };
    } else {
        return { level: 'mastered', color: '#10b981', label: 'Mastered' };
    }
};

/**
 * Calculate study session stats
 */
export const calculateStats = (items: SRSItem[]): {
    total: number;
    mastered: number;
    learning: number;
    new: number;
    dueNow: number;
    averageMastery: number;
} => {
    const dueNow = getDueItems(items).length;
    const mastered = items.filter(i => i.mastery >= 0.7).length;
    const learning = items.filter(i => i.mastery > 0 && i.mastery < 0.7).length;
    const newItems = items.filter(i => i.mastery === 0).length;
    const averageMastery = items.length > 0
        ? items.reduce((sum, i) => sum + i.mastery, 0) / items.length
        : 0;

    return {
        total: items.length,
        mastered,
        learning,
        new: newItems,
        dueNow,
        averageMastery
    };
};
