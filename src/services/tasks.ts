import { google, tasks_v1 } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import {
  CreateTaskParams,
  ListTasksParams,
  UpdateTaskParams,
  DeleteTaskParams,
  GoogleAPIError
} from "../types.js";
import { validateRequired, validateId, validateISODate } from "../utils/validation.js";

export class TasksService {
  async createTask(auth: OAuth2Client, params: CreateTaskParams) {
    validateRequired(params.title, 'title');

    if (params.due) {
      validateISODate(params.due, 'due');
    }

    const tasks = google.tasks({ version: "v1", auth });
    const taskListId = params.taskListId || '@default';

    try {
      const taskBody: tasks_v1.Schema$Task = {
        title: params.title,
      };

      if (params.notes) {
        taskBody.notes = params.notes;
      }

      if (params.due) {
        taskBody.due = params.due;
      }

      const result = await tasks.tasks.insert({
        tasklist: taskListId,
        requestBody: taskBody,
      });

      return {
        content: [{
          type: "text",
          text: `Task created successfully!\nTitle: ${result.data.title}\nTask ID: ${result.data.id}\nStatus: ${result.data.status}${result.data.due ? `\nDue: ${result.data.due}` : ''}`,
        }],
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new GoogleAPIError(`Failed to create task: ${error.message}`, undefined, error);
      }
      throw new GoogleAPIError(`Failed to create task: ${String(error)}`);
    }
  }

  async listTasks(auth: OAuth2Client, params: ListTasksParams = {}) {
    const tasks = google.tasks({ version: "v1", auth });
    const taskListId = params.taskListId || '@default';

    try {
      const listParams: any = {
        tasklist: taskListId,
        maxResults: params.maxResults || 20,
      };

      if (params.showCompleted !== undefined) {
        listParams.showCompleted = params.showCompleted;
      }

      const result = await tasks.tasks.list(listParams);
      const items = result.data.items || [];

      if (items.length === 0) {
        return {
          content: [{
            type: "text",
            text: "No tasks found.",
          }],
        };
      }

      const taskList = items
        .map((task) => {
          const status = task.status === 'completed' ? '✓' : '○';
          const dueStr = task.due ? ` (Due: ${new Date(task.due).toLocaleDateString()})` : '';
          return `${status} [${task.id}] ${task.title}${dueStr}${task.notes ? `\n  Notes: ${task.notes}` : ''}`;
        })
        .join("\n\n");

      return {
        content: [{
          type: "text",
          text: `Found ${items.length} tasks:\n\n${taskList}`,
        }],
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new GoogleAPIError(`Failed to list tasks: ${error.message}`, undefined, error);
      }
      throw new GoogleAPIError(`Failed to list tasks: ${String(error)}`);
    }
  }

  async updateTask(auth: OAuth2Client, params: UpdateTaskParams) {
    validateId(params.taskId, 'taskId');

    if (params.due) {
      validateISODate(params.due, 'due');
    }

    const tasks = google.tasks({ version: "v1", auth });
    const taskListId = params.taskListId || '@default';

    try {
      // Get existing task first
      const existingTask = await tasks.tasks.get({
        tasklist: taskListId,
        task: params.taskId,
      });

      const task = existingTask.data;

      // Update fields
      if (params.title) task.title = params.title;
      if (params.notes !== undefined) task.notes = params.notes;
      if (params.due) task.due = params.due;
      if (params.status) task.status = params.status;

      const result = await tasks.tasks.update({
        tasklist: taskListId,
        task: params.taskId,
        requestBody: task,
      });

      return {
        content: [{
          type: "text",
          text: `Task updated successfully!\nTitle: ${result.data.title}\nStatus: ${result.data.status}${result.data.due ? `\nDue: ${result.data.due}` : ''}`,
        }],
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new GoogleAPIError(`Failed to update task: ${error.message}`, undefined, error);
      }
      throw new GoogleAPIError(`Failed to update task: ${String(error)}`);
    }
  }

  async deleteTask(auth: OAuth2Client, params: DeleteTaskParams) {
    validateId(params.taskId, 'taskId');

    const tasks = google.tasks({ version: "v1", auth });
    const taskListId = params.taskListId || '@default';

    try {
      await tasks.tasks.delete({
        tasklist: taskListId,
        task: params.taskId,
      });

      return {
        content: [{
          type: "text",
          text: `Task deleted successfully (ID: ${params.taskId})`,
        }],
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new GoogleAPIError(`Failed to delete task: ${error.message}`, undefined, error);
      }
      throw new GoogleAPIError(`Failed to delete task: ${String(error)}`);
    }
  }

  async listTaskLists(auth: OAuth2Client) {
    const tasks = google.tasks({ version: "v1", auth });

    try {
      const result = await tasks.tasklists.list();
      const lists = result.data.items || [];

      const listInfo = lists
        .map((list) => `- ${list.title} (ID: ${list.id})`)
        .join("\n");

      return {
        content: [{
          type: "text",
          text: `Available Task Lists:\n\n${listInfo}`,
        }],
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new GoogleAPIError(`Failed to list task lists: ${error.message}`, undefined, error);
      }
      throw new GoogleAPIError(`Failed to list task lists: ${String(error)}`);
    }
  }
}
