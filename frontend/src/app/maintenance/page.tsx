"use client";

import React, { useState } from "react";
import {
  Wrench,
  Plus,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { mockMaintenanceData } from "@/data/mockData";

export default function MaintenancePage() {
  const [filterUrgency, setFilterUrgency] = useState<string>("all");

  const filteredTasks = mockMaintenanceData.tasks.filter((t) => {
    if (filterUrgency === "all") return true;
    return t.urgency.toLowerCase().includes(filterUrgency.toLowerCase());
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Preventive & Corrective Maintenance"
        description="Review local sample work orders for the five equipment records in the seed data."
        badge={<Badge variant="Info" dot>Local Demo Data</Badge>}
        actions={
          <Button variant="purple" size="sm" icon={<Plus className="w-4 h-4" />}>
            New Demo Work Order
          </Button>
        }
      />

      {/* Urgency Categorization Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {mockMaintenanceData.urgencyCards.map((cat, idx) => (
          <Card
            key={idx}
            className={`border ${
              cat.color === "rose"
                ? "bg-rose-950/20 border-rose-500/30 hover:border-rose-500/50"
                : cat.color === "amber"
                ? "bg-amber-950/20 border-amber-500/30 hover:border-amber-500/50"
                : "bg-cyan-950/20 border-cyan-500/30 hover:border-cyan-500/50"
            }`}
          >
            <CardHeader className="flex items-center justify-between pb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                {cat.category}
              </span>
              <Badge
                variant={
                  cat.badge === "Critical"
                    ? "Critical"
                    : cat.badge === "Warning"
                    ? "Warning"
                    : "Scheduled"
                }
                size="sm"
              >
                {cat.count} Tasks
              </Badge>
            </CardHeader>
            <CardContent className="space-y-2.5 pt-1">
              {cat.items.map((item, itemIdx) => (
                <div
                  key={itemIdx}
                  className="flex items-center justify-between text-xs text-slate-300 p-2 rounded-lg bg-slate-900/60 border border-slate-800"
                >
                  <span className="font-medium truncate">{item}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Work Orders List & Execution Pipeline */}
      <Card className="bg-[#0b1220]/90 border-slate-800">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-cyan-400" />
            Active Work Orders & Maintenance Pipeline
          </CardTitle>

          {/* Filter Chips */}
          <div className="flex items-center gap-2 text-xs">
            {["all", "immediate", "week", "scheduled"].map((u) => (
              <button
                key={u}
                onClick={() => setFilterUrgency(u)}
                className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-colors ${
                  filterUrgency === u
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "text-slate-400 hover:text-slate-200 bg-slate-800/40"
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0f172a] text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-5">Work Order ID</th>
                  <th className="py-3 px-5">Task Description</th>
                  <th className="py-3 px-5">Target Equipment</th>
                  <th className="py-3 px-5">Urgency</th>
                  <th className="py-3 px-5">Assigned Team</th>
                  <th className="py-3 px-5">Due Date</th>
                  <th className="py-3 px-5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 px-5 text-center text-slate-500">
                      No work orders match this urgency filter.
                    </td>
                  </tr>
                ) : filteredTasks.map((task) => (
                  <tr
                    key={task.id}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3.5 px-5 font-mono font-bold text-cyan-400">
                      {task.id}
                    </td>
                    <td className="py-3.5 px-5 font-medium text-white">
                      {task.title}
                    </td>
                    <td className="py-3.5 px-5 text-slate-300">
                      {task.equipment} <span className="text-slate-500">({task.equipmentId})</span>
                    </td>
                    <td className="py-3.5 px-5">
                      <Badge
                        variant={
                          task.urgency === "Immediate"
                            ? "Critical"
                            : task.urgency === "This Week"
                            ? "Warning"
                            : "Scheduled"
                        }
                        size="sm"
                      >
                        {task.urgency}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-5 text-slate-300">
                      {task.assignedTo}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-[11px] text-slate-400">
                      {task.dueDate}
                    </td>
                    <td className="py-3.5 px-5">
                      <Badge
                        variant={
                          task.status === "In Progress"
                            ? "Info"
                            : task.status === "Pending"
                            ? "Warning"
                            : "Healthy"
                        }
                        size="sm"
                        dot
                      >
                        {task.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
