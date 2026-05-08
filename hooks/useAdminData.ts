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
        setStaffMembers(result.data);
      } else {
        throw new Error(result.message || "Failed to fetch staff members");
      }
    } catch (err) {
      console.error("Error fetching staff members:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
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
        setTasks(result.data);
        // Extract replies from tasks
        const allReplies: Reply[] = [];
        result.data.forEach((task: Task) => {
          if (task.replies && task.replies.length > 0) {
            task.replies.forEach((reply, index) => {
              allReplies.push({
                id: `${task.id}-${index}`,
                staffName: task.assignedTo.name,
                taskTitle: task.title,
                message: reply.content,
                timeAgo: formatTimeAgo(new Date(reply.createdAt)),
              });
            });
          }
        });
        // Sort replies by most recent first
        allReplies.sort((a, b) => 
          new Date(b.timeAgo).getTime() - new Date(a.timeAgo).getTime()
        );
        setReplies(allReplies.slice(0, 10)); // Show only 10 most recent replies
      } else {
        throw new Error(result.message || "Failed to fetch tasks");
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return "just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  const refreshData = async () => {
    setLoading(true);
    setError(null);
    await Promise.all([fetchStaffMembers(), fetchTasks()]);
    setLoading(false);
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
