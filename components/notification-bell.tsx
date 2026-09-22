"use client"

import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Bell, GitBranchPlus, Check, X, Download, Star, ShoppingCart, Calendar } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

export function NotificationBell() {
  const notifications = useQuery(api.notifications.list)
  const unreadCount = useQuery(api.notifications.unreadCount)
  const markAsRead = useMutation(api.notifications.markAsRead)
  const markAllAsRead = useMutation(api.notifications.markAllAsRead)
  const remove = useMutation(api.notifications.remove)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-7 w-7">
          <Bell className="size-4" />
          {!!unreadCount && unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="text-sm font-medium">Notifications</h4>
          {!!unreadCount && unreadCount > 0 && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => markAllAsRead()}
              className="text-muted-foreground"
            >
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {!notifications || notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="text-muted-foreground/50 mb-2 size-8" />
              <p className="text-muted-foreground text-sm">
                No notifications yet
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={cn(
                    "group flex items-start gap-3 border-b px-4 py-3 last:border-b-0",
                    !notification.read && "bg-accent/50"
                  )}
                >
                  <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
                    {notification.type === "marketplace_download" ? (
                      <Download className="size-3.5 text-muted-foreground" />
                    ) : notification.type === "marketplace_review" ? (
                      <Star className="size-3.5 text-muted-foreground" />
                    ) : notification.type === "marketplace_purchase" ? (
                      <ShoppingCart className="size-3.5 text-muted-foreground" />
                    ) : notification.type === "consultant_booking" ? (
                      <Calendar className="size-3.5 text-muted-foreground" />
                    ) : (
                      <GitBranchPlus className="size-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1 overflow-hidden">
                    <p className="text-sm leading-snug break-words">
                      {notification.title}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatDistanceToNow(notification.createdAt, {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() =>
                          markAsRead({
                            notificationId: notification._id,
                          })
                        }
                        title="Mark as read"
                      >
                        <Check className="size-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() =>
                        remove({ notificationId: notification._id })
                      }
                      title="Remove"
                    >
                      <X className="size-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
