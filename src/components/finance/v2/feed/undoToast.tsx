import toast from "react-hot-toast";

type UndoResult = { success: boolean; error?: string } | void;

/**
 * "Expense deleted · Undo" toast. Undo runs `onUndo` and closes the toast; an
 * undo that is refused (e.g. it would overpay a loan) says why.
 */
export const showUndoToast = (message: string, onUndo: () => UndoResult) =>
    toast(
        (t) => (
            <span className="flex items-center gap-3">
                {message}
                <button
                    className="font-semibold text-primary"
                    onClick={() => {
                        const result = onUndo();
                        toast.dismiss(t.id);
                        if (result && !result.success) {
                            toast.error(result.error ?? "Couldn't undo");
                        }
                    }}>
                    Undo
                </button>
            </span>
        ),
        { duration: 6000 },
    );
