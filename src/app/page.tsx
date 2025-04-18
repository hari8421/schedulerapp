"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { PlusCircle } from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { CalendarIcon, CheckCircle, Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { SuggestTaskScheduleInput, suggestTaskSchedule } from "@/ai/flows/suggest-task-schedule";
import { toast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

interface Task {
  id: string;
  description: string;
  dueDate: Date;
  priority: string;
  estimatedTimeToCompletion: number;
  completed: boolean;
}

const priorities = ["High", "Medium", "Low"];

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(new Date());
  const [priority, setPriority] = useState(priorities[1]);
  const [estimatedTimeToCompletion, setEstimatedTimeToCompletion] = useState(30); // Default to 30 minutes
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    // Load tasks from local storage on initial render
    const storedTasks = localStorage.getItem("tasks");
    if (storedTasks) {
      setTasks(JSON.parse(storedTasks).map((task: Omit<Task, 'dueDate'> & { dueDate: string }) => ({
        ...task,
        dueDate: new Date(task.dueDate),
      })));
    }
  }, []);

  useEffect(() => {
    // Save tasks to local storage whenever the tasks state changes
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  const handleAddTask = () => {
    if (!description || !dueDate || !priority || !estimatedTimeToCompletion) {
      alert("Please fill in all fields.");
      return;
    }

    const newTask: Task = {
      id: crypto.randomUUID(),
      description,
      dueDate,
      priority,
      estimatedTimeToCompletion,
      completed: false,
    };

    setTasks([...tasks, newTask]);
    setDescription("");
    setDueDate(undefined);
    setPriority(priorities[1]);
    setEstimatedTimeToCompletion(30);
    setIsDialogOpen(false);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setDescription(task.description);
    setDueDate(task.dueDate);
    setPriority(task.priority);
    setEstimatedTimeToCompletion(task.estimatedTimeToCompletion);
    setIsDialogOpen(true);
  };

  const handleUpdateTask = () => {
    if (!selectedTask) return;

    const updatedTasks = tasks.map((task) => {
      if (task.id === selectedTask.id) {
        return {
          ...task,
          description,
          dueDate,
          priority,
          estimatedTimeToCompletion,
        };
      }
      return task;
    });

    setTasks(updatedTasks);
    setDescription("");
    setDueDate(undefined);
    setPriority(priorities[1]);
    setEstimatedTimeToCompletion(30);
    setIsDialogOpen(false);
    setSelectedTask(null);
  };

  const handleDeleteTask = (id: string) => {
    const updatedTasks = tasks.filter((task) => task.id !== id);
    setTasks(updatedTasks);
  };

  const handleMarkComplete = (id: string) => {
    const updatedTasks = tasks.map((task) => {
      if (task.id === id) {
        return { ...task, completed: !task.completed };
      }
      return task;
    });
    setTasks(updatedTasks);
  };

  const handleSuggestSchedule = async () => {
    const input: SuggestTaskScheduleInput = tasks.map(task => ({
      description: task.description,
      dueDate: task.dueDate.toISOString(),
      priority: task.priority,
      estimatedTimeToCompletion: task.estimatedTimeToCompletion,
    }));

    try {
      const suggestedSchedule = await suggestTaskSchedule(input);

      if (suggestedSchedule) {
        console.log("Suggested Schedule:", suggestedSchedule);
        // Format the suggested schedule and display it to the user.
        const formattedSchedule = suggestedSchedule.map(slot => {
          const startTime = format(new Date(slot.startTime), "MMM dd, yyyy hh:mm a");
          const endTime = format(new Date(slot.endTime), "MMM dd, yyyy hh:mm a");
          return `Start: ${startTime}, End: ${endTime}`;
        }).join("\n");

        toast({
          title: "Suggested Schedule",
          description: formattedSchedule,
        });
      } else {
        console.log("Could not generate schedule");
        toast({
          title: "Could not generate schedule",
          description: "Please try again later.",
        });
      }
    } catch (error) {
      console.error("Error suggesting schedule:", error);
      toast({
        title: "Error",
        description: "Failed to generate schedule. Please check console for details.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-secondary p-4">
      <Toaster />
      <Card className="w-full max-w-5xl mx-auto my-8">
        <CardHeader>
          <CardTitle className="text-2xl">TaskMaster</CardTitle>
          <CardDescription>
            Manage your tasks effectively and let AI suggest the best schedule.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Task List</h2>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Task
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{selectedTask ? "Edit Task" : "Add Task"}</DialogTitle>
                  <DialogDescription>
                    {selectedTask ? "Update task details." : "Enter task details below."}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      type="text"
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Due Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-[240px] justify-start text-left font-normal",
                            !dueDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dueDate}
                          onSelect={setDueDate}
                          disabled={(date) =>
                            date < new Date()
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="priority">Priority</Label>
                    <select
                      id="priority"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                    >
                      {priorities.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="estimatedTimeToCompletion">
                      Estimated Time to Completion (minutes)
                    </Label>
                    <Input
                      type="number"
                      id="estimatedTimeToCompletion"
                      value={String(estimatedTimeToCompletion)}
                      onChange={(e) =>
                        setEstimatedTimeToCompletion(Number(e.target.value))
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={selectedTask ? handleUpdateTask : handleAddTask}>
                    {selectedTask ? "Update Task" : "Add Task"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Estimated Time (minutes)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>{task.description}</TableCell>
                  <TableCell>{format(task.dueDate, "MMM dd, yyyy")}</TableCell>
                  <TableCell>
                    <Badge>{task.priority}</Badge>
                  </TableCell>
                  <TableCell>{task.estimatedTimeToCompletion}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkComplete(task.id)}
                    >
                      {task.completed ? (
                        <CheckCircle className="h-4 w-4 text-teal-500" />
                      ) : (
                        "Incomplete"
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleEditTask(task)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteTask(task.id)}
                      className="ml-2"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {tasks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No tasks added yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <Button
            variant="default"
            className="mt-4"
            onClick={handleSuggestSchedule}
          >
            Suggest Schedule
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
