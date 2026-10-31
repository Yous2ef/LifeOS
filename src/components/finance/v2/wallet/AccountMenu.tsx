import { MoreVertical, Pin, PinOff, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Account } from "@/types/modules/finance";

const ACCOUNT_MENU_COPY = {
    menu: "Account actions",
    pin: "Pin to top",
    unpin: "Unpin",
    addOpening: "Add opening balance",
};

interface AccountMenuProps {
    account: Account;
    onTogglePin: () => void;
    onAddOpeningBalance: () => void;
    className?: string;
}

/** The "⋮" menu on an account card: pin it first, add an opening balance */
export const AccountMenu = ({
    account,
    onTogglePin,
    onAddOpeningBalance,
    className,
}: AccountMenuProps) => (
    <DropdownMenu>
        {/* The card itself is clickable (it filters the feed) */}
        <DropdownMenuTrigger
            onClick={(e) => e.stopPropagation()}
            aria-label={ACCOUNT_MENU_COPY.menu}
            title={ACCOUNT_MENU_COPY.menu}
            className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                "hover:bg-black/10 dark:hover:bg-white/10 transition-colors",
                className,
            )}>
            <MoreVertical className="w-4 h-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
            align="end"
            className="w-52 rounded-xl"
            onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={onTogglePin} className="gap-2 rounded-lg">
                {account.isPinned ? (
                    <PinOff className="w-4 h-4" />
                ) : (
                    <Pin className="w-4 h-4" />
                )}
                {account.isPinned
                    ? ACCOUNT_MENU_COPY.unpin
                    : ACCOUNT_MENU_COPY.pin}
            </DropdownMenuItem>
            <DropdownMenuItem
                onClick={onAddOpeningBalance}
                className="gap-2 rounded-lg">
                <PlusCircle className="w-4 h-4" />
                {ACCOUNT_MENU_COPY.addOpening}
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
);
