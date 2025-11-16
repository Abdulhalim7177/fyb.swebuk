"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ClusterCount() {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const supabase = createClient();
        const { count } = await supabase
          .from("clusters")
          .select("*", { count: "exact", head: true });
        setCount(count || 0);
      } catch (error) {
        console.error("Error fetching cluster count:", error);
        setCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchCount();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <>{count}</>;
}

export function ActiveMembersCount() {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const supabase = createClient();
        const { count } = await supabase
          .from("cluster_members")
          .select("*", { count: "exact", head: true })
          .eq("status", "approved");
        setCount(count || 0);
      } catch (error) {
        console.error("Error fetching active members count:", error);
        setCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchCount();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <>{count}</>;
}

export function PendingRequestsCount() {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const supabase = createClient();
        const { count } = await supabase
          .from("cluster_members")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending");
        setCount(count || 0);
      } catch (error) {
        console.error("Error fetching pending requests count:", error);
        setCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchCount();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <>{count}</>;
}

interface StaffManagedCountProps {
  userId: string;
}

export function StaffManagedCount({ userId }: StaffManagedCountProps) {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const supabase = createClient();
        const { count } = await supabase
          .from("clusters")
          .select("*", { count: "exact", head: true })
          .eq("staff_manager_id", userId);
        setCount(count || 0);
      } catch (error) {
        console.error("Error fetching staff managed count:", error);
        setCount(0);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchCount();
    } else {
      setLoading(false);
    }
  }, [userId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <>{count}</>;
}