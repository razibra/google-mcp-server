import { google, calendar_v3 } from "googleapis";
import { OAuth2Client } from "google-auth-library";

export class CalendarService {
  async createEvent(auth: OAuth2Client, params: any) {
    const calendar = google.calendar({ version: "v3", auth });

    const event: calendar_v3.Schema$Event = {
      summary: params.summary,
      description: params.description,
      start: {
        dateTime: params.startTime,
        timeZone: "UTC",
      },
      end: {
        dateTime: params.endTime,
        timeZone: "UTC",
      },
    };

    if (params.location) {
      event.location = params.location;
    }

    if (params.attendees && params.attendees.length > 0) {
      event.attendees = params.attendees.map((email: string) => ({ email }));
    }

    try {
      const result = await calendar.events.insert({
        calendarId: params.calendarId || "primary",
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
    } catch (error) {
      throw new Error(`Failed to create event: ${error}`);
    }
  }

  async listEvents(auth: OAuth2Client, params: any) {
    const calendar = google.calendar({ version: "v3", auth });

    try {
      const result = await calendar.events.list({
        calendarId: params.calendarId || "primary",
        maxResults: params.maxResults || 10,
        timeMin: params.timeMin,
        timeMax: params.timeMax,
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
    } catch (error) {
      throw new Error(`Failed to list events: ${error}`);
    }
  }

  async updateEvent(auth: OAuth2Client, params: any) {
    const calendar = google.calendar({ version: "v3", auth });

    // First, get the existing event
    try {
      const existingEvent = await calendar.events.get({
        calendarId: params.calendarId || "primary",
        eventId: params.eventId,
      });

      const event = existingEvent.data;

      // Update only provided fields
      if (params.summary) event.summary = params.summary;
      if (params.description) event.description = params.description;
      if (params.location) event.location = params.location;
      
      if (params.startTime && event.start) {
        event.start.dateTime = params.startTime;
      }
      
      if (params.endTime && event.end) {
        event.end.dateTime = params.endTime;
      }

      const result = await calendar.events.update({
        calendarId: params.calendarId || "primary",
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
    } catch (error) {
      throw new Error(`Failed to update event: ${error}`);
    }
  }
}