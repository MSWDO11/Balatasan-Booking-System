"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, writeBatch, doc } from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, { dot: string; label: string }> = {
  Confirmed:        { dot: "bg-emerald-500", label: "text-emerald-700" },
  Cancelled:        { dot: "bg-rose-500",    label: "text-rose-700"    },
  "Payment Uploaded": { dot: "bg-blue-500",  label: "text-blue-700"   },
  default:          { dot: "bg-primary",     label: "text-primary"     },
};

function getStyle(status: string) {
  return STATUS_STYLES[status] ?? STATUS_STYLES.default;
}

export function NotificationBell() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const notifQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "users", user.uid, "notifications"),
      orderBy("createdAt", "desc")
    );
  }, [firestore, user]);

  const { data: notifications } = useCollection(notifQuery);

  const unread = notifications?.filter((n: any) => !n.read).length ?? 0;

  // Close when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Mark all as read when panel opens
  const handleOpen = async () => {
    setOpen(prev => !prev);
    if (!open && unread > 0 && firestore && user && notifications) {
      const batch = writeBatch(firestore);
      notifications
        .filter((n: any) => !n.read)
        .forEach((n: any) => {
          batch.update(
            doc(firestore, "users", user.uid, "notifications", n.id),
            { read: true }
          );
        });
      await batch.commit();
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative flex items-center justify-center h-9 w-9 rounded-full text-slate-500 hover:text-primary hover:bg-primary/5 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-4.5 w-4.5 h-[18px] w-[18px]" />
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-slate-100 bg-white shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
            <p className="text-sm font-bold text-slate-800">Notifications</p>
            {unread === 0 && notifications?.length > 0 && (
              <span className="text-[10px] text-slate-400 font-medium">All caught up</span>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
            {!notifications || notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-400">
                <Bell className="h-7 w-7 opacity-30" />
                <p className="text-xs font-medium">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n: any) => {
                const style = getStyle(n.status);
                return (
                  <div
                    key={n.id}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 transition-colors",
                      !n.read ? "bg-primary/5" : "bg-white"
                    )}
                  >
                    {/* Status dot */}
                    <span className={cn("mt-1.5 h-2 w-2 rounded-full shrink-0", style.dot)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {n.itemName}
                      </p>
                      <p className={cn("text-xs font-semibold", style.label)}>
                        {n.message}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {n.createdAt
                          ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })
                          : ""}
                      </p>
                    </div>
                    {!n.read && (
                      <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications && notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-slate-50 bg-slate-50/50">
              <p className="text-[10px] text-slate-400 text-center">
                Notifications are cleared automatically after 30 days
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
