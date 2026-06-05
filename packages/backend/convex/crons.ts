import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "send appointment push reminders",
  { minutes: 5 },
  internal.notificationsNode.sendDuePushReminders,
  {}
);

crons.daily(
  "calculate previous month barber mvp",
  { hourUTC: 5, minuteUTC: 5 },
  internal.ratings.awardPreviousMonth,
  {}
);

export default crons;
