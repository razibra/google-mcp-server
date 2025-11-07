import { google, calendar_v3 } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { CreateEventParams, ListEventsParams, UpdateEventParams, GoogleAPIError } from "../types.js";
import { validateRequired, validateISODate, validateTimezone, validateTimeRange, validateEmails, validateId } from "../utils/validation.js";

export class CalendarService {
  async createEvent(auth: OAuth2Client, params: CreateEventParams) {
    // Validate required fields
    validateRequired(params.summary, 'summary');
    validateISODate(params.startTime, 'startTime');
    validateISODate(params.endTime, 'endTime');

    // Validate time range
    validateTimeRange(params.startTime, params.endTime);

    // Validate optional fields
    if (params.timezone) {
      validateTimezone(params.timezone);
    }
    if (params.attendees) {
      validateEmails(params.attendees);
    }

    const calendar = google.calendar({ version: "v3", auth });
    const timezone = params.timezone || "UTC";

    const event: calendar_v3.Schema$Event = {
      summary: params.summary,
      description: params.description,
      start: {
        dateTime: params.startTime,
        timeZone: timezone,
      },
      end: {
        dateTime: params.endTime,
        timeZone: timezone,
      },
    };

    if (params.location) {
      event.location = params.location;
    }

    if (params.attendees && params.attendees.trim().length > 0) {
      const attendeeEmails = params.attendees.split(',').map(e => e.trim());
      event.attendees = attendeeEmails.map((email: string) => ({ email }));
    }

    try {
      const result = await calendar.events.insert({
        calendarId: "primary",
        requestBody: event,
      });

      return {
        content: [
          {
            type: "text",
            text: `Event created successfully!\nEvent ID: ${result.data.id}\nEvent Link: ${result.data.htmlLink}`,
          },
        ],
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new GoogleAPIError(`Failed to create event: ${error.message}`, undefined, error);
      }
      throw new GoogleAPIError(`Failed to create event: ${String(error)}`);
    }
  }

  async listEvents(auth: OAuth2Client, params: ListEventsParams = {}) {
    // Validate optional fields
    if (params.timeMin) {
      validateISODate(params.timeMin, 'timeMin');
    }
    if (params.timeMax) {
      validateISODate(params.timeMax, 'timeMax');
    }
    if (params.timeMin && params.timeMax) {
      validateTimeRange(params.timeMin, params.timeMax);
    }
    if (params.timezone) {
      validateTimezone(params.timezone);
    }

    const calendar = google.calendar({ version: "v3", auth });

    try {
      const result = await calendar.events.list({
        calendarId: "primary",
        maxResults: params.maxResults || 10,
        timeMin: params.timeMin,
        timeMax: params.timeMax,
        timeZone: params.timezone,
        singleEvents: true,
        orderBy: "startTime",
      });

      const events = result.data.items || [];

      if (events.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No events found.",
            },
          ],
        };
      }

      const eventList = events.map((event) => {
        const start = event.start?.dateTime || event.start?.date;
        return `- ${event.summary} (${start}, ID: ${event.id})`;
      }).join("\n");

      return {
        content: [
          {
            type: "text",
            text: `Found ${events.length} events:\n${eventList}`,
          },
        ],
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new GoogleAPIError(`Failed to list events: ${error.message}`, undefined, error);
      }
      throw new GoogleAPIError(`Failed to list events: ${String(error)}`);
    }
  }

  async updateEvent(auth: OAuth2Client, params: UpdateEventParams) {
    // Validate required fields
    validateId(params.eventId, 'eventId');

    // Validate optional date fields
    if (params.startTime) {
      validateISODate(params.startTime, 'startTime');
    }
    if (params.endTime) {
      validateISODate(params.endTime, 'endTime');
    }
    if (params.startTime && params.endTime) {
      validateTimeRange(params.startTime, params.endTime);
    }
    if (params.timezone) {
      validateTimezone(params.timezone);
    }
    if (params.attendees) {
      validateEmails(params.attendees);
    }

    const calendar = google.calendar({ version: "v3", auth });

    // First, get the existing event
    try {
      const existingEvent = await calendar.events.get({
        calendarId: "primary",
        eventId: params.eventId,
      });

      const event = existingEvent.data;

      // Update only provided fields
      if (params.summary) event.summary = params.summary;
      if (params.description) event.description = params.description;
      if (params.location) event.location = params.location;

      // Update timezone if provided
      const timezone = params.timezone || event.start?.timeZone || "UTC";

      if (params.startTime && event.start) {
        event.start.dateTime = params.startTime;
        event.start.timeZone = timezone;
      }

      if (params.endTime && event.end) {
        event.end.dateTime = params.endTime;
        event.end.timeZone = timezone;
      }

      if (params.attendees) {
        const attendeeEmails = params.attendees.split(',').map(e => e.trim());
        event.attendees = attendeeEmails.map((email: string) => ({ email }));
      }

      const result = await calendar.events.update({
        calendarId: "primary",
        eventId: params.eventId,
        requestBody: event,
      });

      return {
        content: [
          {
            type: "text",
            text: `Event updated successfully!\nEvent ID: ${result.data.id}\nEvent Link: ${result.data.htmlLink}`,
          },
        ],
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new GoogleAPIError(`Failed to update event: ${error.message}`, undefined, error);
      }
      throw new GoogleAPIError(`Failed to update event: ${String(error)}`);
    }
  }
}