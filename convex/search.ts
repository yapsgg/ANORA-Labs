import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server";

// Get recent flows (created today) and projects (created past week) for search
export const getRecent = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return { flowsToday: [], projectsThisWeek: [] };

    const now = Date.now();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayTimestamp = startOfToday.getTime();

    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

    // Get all user's flows
    const allFlows = await ctx.db
      .query("flows")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Get all user's projects
    const allProjects = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Filter flows created today
    const flowsToday = allFlows
      .filter((flow) => flow.updatedAt >= todayTimestamp)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((flow) => {
        const project = allProjects.find((p) => p._id === flow.projectId);
        return {
          _id: flow._id,
          name: flow.name,
          projectId: flow.projectId,
          projectName: project?.name ?? "Unknown Project",
          updatedAt: flow.updatedAt,
          coverUrl: flow.coverUrl,
        };
      });

    // Filter projects created/updated in past week
    const projectsThisWeek = allProjects
      .filter((project) => project.updatedAt >= oneWeekAgo)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((project) => ({
        _id: project._id,
        name: project.name,
        updatedAt: project.updatedAt,
        image: project.image,
      }));

    return { flowsToday, projectsThisWeek };
  },
});

// Search across all flows and projects
export const search = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return { flows: [], projects: [] };

    // Get all user's flows with project info
    const allFlows = await ctx.db
      .query("flows")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Get all user's projects
    const allProjects = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Map flows with project names
    const flows = allFlows
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((flow) => {
        const project = allProjects.find((p) => p._id === flow.projectId);
        return {
          _id: flow._id,
          name: flow.name,
          projectId: flow.projectId,
          projectName: project?.name ?? "Unknown Project",
          updatedAt: flow.updatedAt,
          coverUrl: flow.coverUrl,
        };
      });

    // Map projects
    const projects = allProjects
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((project) => ({
        _id: project._id,
        name: project.name,
        updatedAt: project.updatedAt,
        image: project.image,
      }));

    return { flows, projects };
  },
});
