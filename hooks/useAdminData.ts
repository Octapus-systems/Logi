"use client";

import { useEffect, useState } from "react";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  lives: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  isCheckedIn?: boolean;
  isOnBreak?: boolean;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignedTo: {
    _id: string;
    name: string;
    email: string;
  };
  assignedBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  totalTimeSpent: number;
  isTimerRunning: boolean;
  timeElapsed: number;
  replies: Array<{
    content: string;
    createdAt: string;
    updatedAt?: string;
  }>;
}

interface Reply {
  id: string;
  staffName: string;
  taskTitle: string;
  message: string;
  timeAgo: string;
  timestamp: Date;
}

interface LiveAttendance {
  userId: string;
  name: string;
  email: string;
  lives: number;
  isOnBreak: boolean;
  checkInTime: string;
}

export function useAdminData() {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStaffMembers = async () => {
    try {
      const response = await fetch("/api/v1/users");
      if (!response.ok) {
        throw new Error("Failed to fetch staff members");
      }
      const result = await response.json();
      if (result.success) {
        // Transform _id to id for consistency
        return result.data.map((s: Omit<StaffMember, 'id'> & { _id?: string; id?: string }) => ({
          ...s,
          id: s._id || s.id || ""
        }));
      } else {
        throw new Error(result.message || "Failed to fetch staff members");
      }
    } catch (err) {
      console.error("Error fetching staff members:", err);
      throw err;
    }
  };

  const fetchLiveAttendance = async () => {
    try {
      const response = await fetch("/api/v1/lives");
      if (!response.ok) {
        throw new Error("Failed to fetch live attendance");
      }
      const result = await response.json();
      if (result.success) {
        return result.data as LiveAttendance[];
      }
      return [];
    } catch (err) {
      console.error("Error fetching live attendance:", err);
      return [];
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/v1/tasks");
      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }
      const result = await response.json();
      if (result.success) {
        return result.data as Task[];
      } else {
        throw new Error(result.message || "Failed to fetch tasks");
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
      throw err;
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  };

  const refreshData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [staffData, taskData, liveData] = await Promise.all([
        fetchStaffMembers(),
        fetchTasks(),
        fetchLiveAttendance()
      ]);

      // Merge live attendance into staff members
      const enhancedStaff = staffData.map((staff: StaffMember) => {
        const live = liveData.find(l => l.userId === staff.id);
        return {
          ...staff,
          isCheckedIn: !!live,
          isOnBreak: live?.isOnBreak || false,
          lives: live ? live.lives : staff.lives
        };
      });

      setStaffMembers(enhancedStaff);
      setTasks(taskData);

      // Extract and sort replies
      const allReplies: Reply[] = [];
      taskData.forEach((task: Task) => {
        if (task.replies && task.replies.length > 0) {
          task.replies.forEach((reply, index) => {
            allReplies.push({
              id: `${task.id}-${index}`,
              staffName: task.assignedTo?.name || "Unknown",
              taskTitle: task.title,
              message: reply.content,
              timeAgo: formatTimeAgo(new Date(reply.createdAt)),
              timestamp: new Date(reply.createdAt)
            });
          });
        }
      });

      // Sort by real timestamp
      allReplies.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setReplies(allReplies.slice(0, 10));

    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  return {
    staffMembers,
    tasks,
    replies,
    loading,
    error,
    refreshData,
  };
}
