/**
 * Miscellaneous Module Types for LifeOS
 *
 * Contains types for miscellaneous features including:
 * - Notes
 * - Bookmarks
 * - Quick capture
 */

// Note Type
export interface Note {
    id: string;
    title: string;
    content: string;
    tags: string[];
    createdAt: string;
    updatedAt: string;
}

// Bookmark Type
export interface Bookmark {
    id: string;
    title: string;
    url: string;
    category: string;
    tags: string[];
    createdAt: string;
}

// Quick Capture Type
export interface QuickCapture {
    id: string;
    content: string;
    module?: "university" | "freelancing" | "programming" | "home" | "misc";
    processed: boolean;
    createdAt: string;
}

// Misc Module Data Structure
export interface MiscData {
    notes: Note[];
    bookmarks: Bookmark[];
    quickCaptures: QuickCapture[];
}
