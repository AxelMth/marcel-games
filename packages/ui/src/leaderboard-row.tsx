import * as React from "react";
import { cn } from "./utils";
import { Avatar, AvatarImage, AvatarFallback } from "./avatar";

export interface LeaderboardRowProps {
  rank: number;
  username: string;
  score: number;
  avatarUrl?: string;
  highlight?: boolean;
  className?: string;
}

const rankColors: Record<number, string> = {
  1: "text-yellow-400",
  2: "text-slate-300",
  3: "text-amber-600",
};

export function LeaderboardRow({
  rank,
  username,
  score,
  avatarUrl,
  highlight,
  className,
}: LeaderboardRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg px-4 py-3",
        highlight ? "bg-primary/10 ring-1 ring-primary/30" : "bg-card",
        className
      )}
    >
      <span
        className={cn(
          "w-6 text-center font-mono text-sm font-bold",
          rankColors[rank] ?? "text-muted-foreground"
        )}
      >
        {rank}
      </span>
      <Avatar className="size-8">
        {avatarUrl && (
          <AvatarImage src={avatarUrl} alt={username} />
        )}
        <AvatarFallback>
          {username.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <span className="flex-1 truncate text-sm font-medium text-foreground">
        {username}
      </span>
      <span className="font-mono text-sm font-bold text-primary">
        {score.toLocaleString()}
      </span>
    </div>
  );
}
