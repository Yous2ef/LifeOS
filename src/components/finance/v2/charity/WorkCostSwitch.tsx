import { Briefcase } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { COPY } from "./copy";

/** Expense form's "Work cost" switch (charity base = earnings − work costs) */
export const WorkCostSwitch = ({
    checked,
    onChange,
}: {
    checked: boolean;
    onChange: (checked: boolean) => void;
}) => (
    <label className="flex items-center justify-between gap-3 p-3 bg-muted/30 rounded-xl cursor-pointer">
        <span className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-muted-foreground" />
            <span>
                <span className="block text-sm">{COPY.workCost}</span>
                <span className="block text-xs text-muted-foreground">
                    {COPY.workCostHelper}
                </span>
            </span>
        </span>
        <Switch
            checked={checked}
            onCheckedChange={onChange}
            aria-label={COPY.workCost}
        />
    </label>
);
