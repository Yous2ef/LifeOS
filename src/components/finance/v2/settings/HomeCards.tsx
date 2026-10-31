import { EyeOff, LayoutGrid } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import type { HomeCardId } from "@/types/modules/finance";
import { showUndoToast } from "../feed/undoToast";

const HOME_CARDS: { id: HomeCardId; label: string }[] = [
    { id: "budget", label: "Budget" },
    { id: "goals", label: "Goals" },
    { id: "installments", label: "Installments" },
];

const HOME_CARDS_COPY = {
    title: "Home cards",
    help: "Choose which cards the finance home shows.",
    hide: (label: string) => `Hide ${label}`,
    hidden: "Hidden. Show it again in Settings → Home cards",
};

const labelOf = (card: HomeCardId) =>
    HOME_CARDS.find((c) => c.id === card)?.label ?? card;

interface HomeCardHideButtonProps {
    card: HomeCardId;
    onChange: (card: HomeCardId, hidden: boolean) => void;
}

/**
 * Eye-off button in a home card's header. The toast says where to bring it
 * back (Settings → Home cards) and can undo right away.
 */
export const HomeCardHideButton = ({ card, onChange }: HomeCardHideButtonProps) => (
    <button
        type="button"
        onClick={() => {
            onChange(card, true);
            showUndoToast(HOME_CARDS_COPY.hidden, () => onChange(card, false));
        }}
        title={HOME_CARDS_COPY.hide(labelOf(card))}
        aria-label={HOME_CARDS_COPY.hide(labelOf(card))}
        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
        <EyeOff className="w-4 h-4" />
    </button>
);

interface HomeCardsSettingsProps {
    hidden: HomeCardId[];
    onChange: (card: HomeCardId, hidden: boolean) => void;
}

/** "Home cards" section of finance settings: one switch per card */
export const HomeCardsSettings = ({ hidden, onChange }: HomeCardsSettingsProps) => (
    <div className="p-4 bg-muted/30 rounded-2xl space-y-3">
        <div>
            <div className="flex items-center gap-2 text-sm font-medium">
                <LayoutGrid className="w-4 h-4 text-primary" />
                {HOME_CARDS_COPY.title}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
                {HOME_CARDS_COPY.help}
            </p>
        </div>
        {HOME_CARDS.map((card) => (
            <div key={card.id} className="flex items-center justify-between">
                <span className="text-sm">{card.label}</span>
                <Switch
                    checked={!hidden.includes(card.id)}
                    onCheckedChange={(checked) => onChange(card.id, !checked)}
                    aria-label={card.label}
                />
            </div>
        ))}
    </div>
);
