"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function RealtimeAttendance() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Subscribe to changes in the attendance table
    const channel = supabase
      .channel("attendance-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "attendance",
        },
        () => {
          // Refresh the page data when a new attendance record is added
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, router]);

  return null; // This component doesn't render anything
}
