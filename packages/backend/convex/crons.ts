import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "send appointment push reminders",
  { minutes: 5 },
  internal.notificationsNode.sendDuePushReminders,
  {}
);

export default crons;
