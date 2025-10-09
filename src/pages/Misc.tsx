import { useState, useMemo } from "react";
import {
    Plus,
    BookOpen,
    Bookmark as BookmarkIcon,
    Inbox,
    Search,
    Edit,
    Trash2,
    ExternalLink,
    Tag,
    Calendar,
    Clock,
    CheckCircle2,
    FileText,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApp } from "../context/AppContext";
import { formatDate } from "../utils/helpers";
import type { Note, Bookmark, QuickCapture } from "../types";
import { NoteModal } from "../components/misc/NoteModal";
import { BookmarkModal } from "../components/misc/BookmarkModal";
import { QuickCaptureModal } from "../components/misc/QuickCaptureModal";

export const Misc = () => {
    const { data, updateData, showToast } = useApp();
    const [activeTab, setActiveTab] = useState("notes");
    const [searchQuery, setSearchQuery] = useState("");
    const [noteModalOpen, setNoteModalOpen] = useState(false);
    const [bookmarkModalOpen, setBookmarkModalOpen] = useState(false);
    const [captureModalOpen, setCaptureModalOpen] = useState(false);
    const [editingNote, setEditingNote] = useState<Note | undefined>(undefined);
    const [editingBookmark, setEditingBookmark] = useState<
        Bookmark | undefined
    >(undefined);
    const [editingCapture, setEditingCapture] = useState<
        QuickCapture | undefined
    >(undefined);

    // Calculate stats
    const stats = useMemo(() => {
        const totalNotes = data.misc.notes.length;
        const totalBookmarks = data.misc.bookmarks.length;
        const totalCaptures = data.misc.quickCaptures.length;
        const unprocessedCaptures = data.misc.quickCaptures.filter(
            (c) => !c.processed
        ).length;

        return {
            totalNotes,
            totalBookmarks,
            totalCaptures,
            unprocessedCaptures,
        };
    }, [data.misc]);

    // Filter data based on search
    const filteredNotes = useMemo(() => {
        if (!searchQuery) return data.misc.notes;
        return data.misc.notes.filter(
            (note) =>
                note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                note.content
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                note.tags.some((tag) =>
                    tag.toLowerCase().includes(searchQuery.toLowerCase())
                )
        );
    }, [data.misc.notes, searchQuery]);

    const filteredBookmarks = useMemo(() => {
        if (!searchQuery) return data.misc.bookmarks;
        return data.misc.bookmarks.filter(
            (bookmark) =>
                bookmark.title
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                bookmark.category
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                bookmark.tags.some((tag) =>
                    tag.toLowerCase().includes(searchQuery.toLowerCase())
                )
        );
    }, [data.misc.bookmarks, searchQuery]);

    // Note handlers
    const handleAddNote = () => {
        setEditingNote(undefined);
        setNoteModalOpen(true);
    };

    const handleEditNote = (note: Note) => {
        setEditingNote(note);
        setNoteModalOpen(true);
    };

    const handleDeleteNote = (noteId: string) => {
        if (confirm("Are you sure you want to delete this note?")) {
            updateData({
                misc: {
                    ...data.misc,
                    notes: data.misc.notes.filter((n) => n.id !== noteId),
                },
            });
            showToast("Note deleted successfully", "success");
        }
    };

    // Bookmark handlers
    const handleAddBookmark = () => {
        setEditingBookmark(undefined);
        setBookmarkModalOpen(true);
    };

    const handleEditBookmark = (bookmark: Bookmark) => {
        setEditingBookmark(bookmark);
        setBookmarkModalOpen(true);
    };

    const handleDeleteBookmark = (bookmarkId: string) => {
        if (confirm("Are you sure you want to delete this bookmark?")) {
            updateData({
                misc: {
                    ...data.misc,
                    bookmarks: data.misc.bookmarks.filter(
                        (b) => b.id !== bookmarkId
                    ),
                },
            });
            showToast("Bookmark deleted successfully", "success");
        }
    };

    // Quick Capture handlers
    const handleAddCapture = () => {
        setEditingCapture(undefined);
        setCaptureModalOpen(true);
    };

    const handleEditCapture = (capture: QuickCapture) => {
        setEditingCapture(capture);
        setCaptureModalOpen(true);
    };

    const handleDeleteCapture = (captureId: string) => {
        if (confirm("Are you sure you want to delete this capture?")) {
            updateData({
                misc: {
                    ...data.misc,
                    quickCaptures: data.misc.quickCaptures.filter(
                        (c) => c.id !== captureId
                    ),
                },
            });
            showToast("Capture deleted successfully", "success");
        }
    };

    const handleProcessCapture = (captureId: string) => {
        updateData({
            misc: {
                ...data.misc,
                quickCaptures: data.misc.quickCaptures.map((c) =>
                    c.id === captureId ? { ...c, processed: true } : c
                ),
            },
        });
        showToast("Capture marked as processed", "success");
    };

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            work: "bg-blue-500/10 text-blue-500",
            personal: "bg-purple-500/10 text-purple-500",
            learning: "bg-green-500/10 text-green-500",
            reference: "bg-orange-500/10 text-orange-500",
            inspiration: "bg-pink-500/10 text-pink-500",
            tools: "bg-cyan-500/10 text-cyan-500",
        };
        return colors[category.toLowerCase()] || "bg-gray-500/10 text-gray-500";
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-bold mb-2 gradient-text">
                    Miscellaneous
                </h1>
                <p className="text-muted-foreground">
                    Notes, bookmarks, and quick captures for everything else
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Quick Notes
                        </CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.totalNotes}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            notes saved
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Bookmarks
                        </CardTitle>
                        <BookmarkIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.totalBookmarks}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            links bookmarked
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Quick Captures
                        </CardTitle>
                        <Inbox className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.totalCaptures}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            items captured
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Inbox Items
                        </CardTitle>
                        <Inbox className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.unprocessedCaptures}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            need processing
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                    placeholder="Search notes, bookmarks, and captures..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="notes">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Notes
                    </TabsTrigger>
                    <TabsTrigger value="bookmarks">
                        <BookmarkIcon className="w-4 h-4 mr-2" />
                        Bookmarks
                    </TabsTrigger>
                    <TabsTrigger value="captures">
                        <Inbox className="w-4 h-4 mr-2" />
                        Quick Captures
                    </TabsTrigger>
                </TabsList>

                {/* Notes Tab */}
                <TabsContent value="notes" className="space-y-4">
                    <div className="flex justify-end">
                        <Button onClick={handleAddNote}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Note
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredNotes.map((note) => (
                            <Card key={note.id} className="group">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <CardTitle className="text-lg">
                                            {note.title}
                                        </CardTitle>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() =>
                                                    handleEditNote(note)
                                                }>
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() =>
                                                    handleDeleteNote(note.id)
                                                }>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <p className="text-sm text-muted-foreground line-clamp-3">
                                        {note.content}
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                        {note.tags.map((tag) => (
                                            <Badge
                                                key={tag}
                                                variant="secondary">
                                                <Tag className="w-3 h-3 mr-1" />
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Clock className="w-3 h-3" />
                                        Updated {formatDate(note.updatedAt)}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {filteredNotes.length === 0 && (
                            <Card className="col-span-full">
                                <CardContent className="py-12">
                                    <p className="text-center text-muted-foreground">
                                        {searchQuery
                                            ? "No notes found matching your search"
                                            : "No notes yet. Create your first note!"}
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </TabsContent>

                {/* Bookmarks Tab */}
                <TabsContent value="bookmarks" className="space-y-4">
                    <div className="flex justify-end">
                        <Button onClick={handleAddBookmark}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Bookmark
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredBookmarks.map((bookmark) => (
                            <Card key={bookmark.id} className="group">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <BookmarkIcon className="w-4 h-4" />
                                            {bookmark.title}
                                        </CardTitle>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() =>
                                                    handleEditBookmark(bookmark)
                                                }>
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() =>
                                                    handleDeleteBookmark(
                                                        bookmark.id
                                                    )
                                                }>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            className={getCategoryColor(
                                                bookmark.category
                                            )}>
                                            {bookmark.category}
                                        </Badge>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {bookmark.tags.map((tag) => (
                                            <Badge key={tag} variant="outline">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        asChild>
                                        <a
                                            href={bookmark.url}
                                            target="_blank"
                                            rel="noopener noreferrer">
                                            <ExternalLink className="w-4 h-4 mr-2" />
                                            Open Link
                                        </a>
                                    </Button>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Calendar className="w-3 h-3" />
                                        Added {formatDate(bookmark.createdAt)}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {filteredBookmarks.length === 0 && (
                            <Card className="col-span-full">
                                <CardContent className="py-12">
                                    <p className="text-center text-muted-foreground">
                                        {searchQuery
                                            ? "No bookmarks found matching your search"
                                            : "No bookmarks yet. Add your first bookmark!"}
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </TabsContent>

                {/* Quick Captures Tab */}
                <TabsContent value="captures" className="space-y-4">
                    <div className="flex justify-end">
                        <Button onClick={handleAddCapture}>
                            <Plus className="w-4 h-4 mr-2" />
                            Quick Capture
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {data.misc.quickCaptures.map((capture) => (
                            <Card
                                key={capture.id}
                                className={
                                    capture.processed ? "opacity-60" : ""
                                }>
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-4">
                                        <div
                                            className="mt-1 cursor-pointer"
                                            onClick={() =>
                                                handleProcessCapture(capture.id)
                                            }>
                                            {capture.processed ? (
                                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                                            ) : (
                                                <Inbox className="w-5 h-5 text-orange-500" />
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <p
                                                className={
                                                    capture.processed
                                                        ? "line-through"
                                                        : ""
                                                }>
                                                {capture.content}
                                            </p>
                                            <div className="flex items-center gap-3">
                                                {capture.module && (
                                                    <Badge variant="secondary">
                                                        {capture.module}
                                                    </Badge>
                                                )}
                                                <span className="text-xs text-muted-foreground">
                                                    {formatDate(
                                                        capture.createdAt
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() =>
                                                    handleEditCapture(capture)
                                                }>
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() =>
                                                    handleDeleteCapture(
                                                        capture.id
                                                    )
                                                }>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {data.misc.quickCaptures.length === 0 && (
                            <Card>
                                <CardContent className="py-12">
                                    <p className="text-center text-muted-foreground">
                                        No quick captures yet. Capture your
                                        first idea!
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Modals */}
            <NoteModal
                isOpen={noteModalOpen}
                onClose={() => setNoteModalOpen(false)}
                note={editingNote}
            />
            <BookmarkModal
                isOpen={bookmarkModalOpen}
                onClose={() => setBookmarkModalOpen(false)}
                bookmark={editingBookmark}
            />
            <QuickCaptureModal
                isOpen={captureModalOpen}
                onClose={() => setCaptureModalOpen(false)}
                capture={editingCapture}
            />
        </div>
    );
};
