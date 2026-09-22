import { cn } from "@/lib/utils";

interface StyledShortcutProps {
    shortcut: string;
    className?: string;
}

export function StyledShortcut({ shortcut, className }: StyledShortcutProps) {
    return (
        <span className={cn(
            'ml-auto text-[11px] text-muted-foreground flex items-center justify-center', 
            className
        )}>
            {shortcut}
        </span>
    )
}
