import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import {
  YouTubeSearchParams,
  YouTubeListVideosParams,
  YouTubeGetVideoDetailsParams,
  YouTubeCreatePlaylistParams,
  YouTubeAddToPlaylistParams,
  GoogleAPIError
} from "../types.js";
import { validateRequired } from "../utils/validation.js";

export class YouTubeService {
  /**
   * Search for videos, channels, or playlists on YouTube
   */
  async search(auth: OAuth2Client, params: YouTubeSearchParams) {
    validateRequired(params.query, 'query');

    const youtube = google.youtube({ version: "v3", auth });

    try {
      const response = await youtube.search.list({
        part: ['snippet'],
        q: params.query,
        maxResults: params.maxResults || 10,
        type: params.type ? [params.type] : undefined,
        order: params.order as any,
      });

      const items = response.data.items || [];

      if (items.length === 0) {
        return {
          content: [{
            type: "text",
            text: `No results found for query: "${params.query}"`,
          }],
        };
      }

      let responseText = `🔍 YouTube Search Results for "${params.query}":\n\n`;

      items.forEach((item: any, index: number) => {
        const snippet = item.snippet;
        responseText += `${index + 1}. ${snippet.title}\n`;

        if (item.id.kind === 'youtube#video') {
          responseText += `   Type: Video\n`;
          responseText += `   Video ID: ${item.id.videoId}\n`;
          responseText += `   URL: https://www.youtube.com/watch?v=${item.id.videoId}\n`;
        } else if (item.id.kind === 'youtube#channel') {
          responseText += `   Type: Channel\n`;
          responseText += `   Channel ID: ${item.id.channelId}\n`;
          responseText += `   URL: https://www.youtube.com/channel/${item.id.channelId}\n`;
        } else if (item.id.kind === 'youtube#playlist') {
          responseText += `   Type: Playlist\n`;
          responseText += `   Playlist ID: ${item.id.playlistId}\n`;
          responseText += `   URL: https://www.youtube.com/playlist?list=${item.id.playlistId}\n`;
        }

        responseText += `   Channel: ${snippet.channelTitle}\n`;
        responseText += `   Published: ${new Date(snippet.publishedAt).toLocaleDateString()}\n`;
        if (snippet.description) {
          const desc = snippet.description.substring(0, 100);
          responseText += `   Description: ${desc}${snippet.description.length > 100 ? '...' : ''}\n`;
        }
        responseText += '\n';
      });

      return {
        content: [{
          type: "text",
          text: responseText,
        }],
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new GoogleAPIError(`Failed to search YouTube: ${error.message}`, undefined, error);
      }
      throw new GoogleAPIError(`Failed to search YouTube: ${String(error)}`);
    }
  }

  /**
   * List videos from a channel or by video IDs
   */
  async listVideos(auth: OAuth2Client, params: YouTubeListVideosParams) {
    const youtube = google.youtube({ version: "v3", auth });

    try {
      let response;

      if (params.videoIds && params.videoIds.length > 0) {
        // Get specific videos by IDs
        response = await youtube.videos.list({
          part: ['snippet', 'statistics', 'contentDetails'],
          id: params.videoIds,
        });
      } else if (params.channelId) {
        // Get videos from channel
        const searchResponse = await youtube.search.list({
          part: ['id'],
          channelId: params.channelId,
          maxResults: params.maxResults || 10,
          order: 'date',
          type: ['video'],
        });

        const videoIds = searchResponse.data.items?.map((item: any) => item.id.videoId).filter(Boolean) || [];

        if (videoIds.length === 0) {
          return {
            content: [{
              type: "text",
              text: `No videos found for channel: ${params.channelId}`,
            }],
          };
        }

        response = await youtube.videos.list({
          part: ['snippet', 'statistics', 'contentDetails'],
          id: videoIds,
        });
      } else {
        throw new GoogleAPIError('Either channelId or videoIds must be provided');
      }

      const videos = response.data.items || [];

      if (videos.length === 0) {
        return {
          content: [{
            type: "text",
            text: 'No videos found',
          }],
        };
      }

      let responseText = `📹 YouTube Videos:\n\n`;

      videos.forEach((video: any, index: number) => {
        const snippet = video.snippet;
        const stats = video.statistics;

        responseText += `${index + 1}. ${snippet.title}\n`;
        responseText += `   Video ID: ${video.id}\n`;
        responseText += `   URL: https://www.youtube.com/watch?v=${video.id}\n`;
        responseText += `   Channel: ${snippet.channelTitle}\n`;
        responseText += `   Published: ${new Date(snippet.publishedAt).toLocaleDateString()}\n`;

        if (stats) {
          responseText += `   Views: ${parseInt(stats.viewCount || '0').toLocaleString()}\n`;
          responseText += `   Likes: ${parseInt(stats.likeCount || '0').toLocaleString()}\n`;
          responseText += `   Comments: ${parseInt(stats.commentCount || '0').toLocaleString()}\n`;
        }

        responseText += '\n';
      });

      return {
        content: [{
          type: "text",
          text: responseText,
        }],
      };
    } catch (error: unknown) {
      if (error instanceof GoogleAPIError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new GoogleAPIError(`Failed to list videos: ${error.message}`, undefined, error);
      }
      throw new GoogleAPIError(`Failed to list videos: ${String(error)}`);
    }
  }

  /**
   * Get detailed information about a specific video
   */
  async getVideoDetails(auth: OAuth2Client, params: YouTubeGetVideoDetailsParams) {
    validateRequired(params.videoId, 'videoId');

    const youtube = google.youtube({ version: "v3", auth });

    try {
      const response = await youtube.videos.list({
        part: ['snippet', 'statistics', 'contentDetails', 'status'],
        id: [params.videoId],
      });

      const videos = response.data.items || [];

      if (videos.length === 0) {
        return {
          content: [{
            type: "text",
            text: `Video not found: ${params.videoId}`,
          }],
        };
      }

      const video = videos[0];
      const snippet = video.snippet!;
      const stats = video.statistics;
      const details = video.contentDetails;

      let responseText = `📹 Video Details\n\n`;
      responseText += `Title: ${snippet.title}\n`;
      responseText += `Video ID: ${params.videoId}\n`;
      responseText += `URL: https://www.youtube.com/watch?v=${params.videoId}\n\n`;

      responseText += `Channel: ${snippet.channelTitle}\n`;
      responseText += `Channel ID: ${snippet.channelId}\n`;
      responseText += `Published: ${new Date(snippet.publishedAt!).toLocaleString()}\n\n`;

      if (details) {
        responseText += `Duration: ${details.duration}\n`;
        responseText += `Definition: ${details.definition}\n\n`;
      }

      if (stats) {
        responseText += `📊 Statistics:\n`;
        responseText += `Views: ${parseInt(stats.viewCount || '0').toLocaleString()}\n`;
        responseText += `Likes: ${parseInt(stats.likeCount || '0').toLocaleString()}\n`;
        responseText += `Comments: ${parseInt(stats.commentCount || '0').toLocaleString()}\n\n`;
      }

      if (snippet.description) {
        responseText += `Description:\n${snippet.description.substring(0, 500)}${snippet.description.length > 500 ? '...' : ''}\n\n`;
      }

      if (snippet.tags && snippet.tags.length > 0) {
        responseText += `Tags: ${snippet.tags.slice(0, 10).join(', ')}${snippet.tags.length > 10 ? '...' : ''}\n`;
      }

      return {
        content: [{
          type: "text",
          text: responseText,
        }],
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new GoogleAPIError(`Failed to get video details: ${error.message}`, undefined, error);
      }
      throw new GoogleAPIError(`Failed to get video details: ${String(error)}`);
    }
  }

  /**
   * Create a new YouTube playlist
   */
  async createPlaylist(auth: OAuth2Client, params: YouTubeCreatePlaylistParams) {
    validateRequired(params.title, 'title');

    const youtube = google.youtube({ version: "v3", auth });

    try {
      const response = await youtube.playlists.insert({
        part: ['snippet', 'status'],
        requestBody: {
          snippet: {
            title: params.title,
            description: params.description || '',
          },
          status: {
            privacyStatus: params.privacyStatus || 'private',
          },
        },
      });

      const playlist = response.data;

      return {
        content: [{
          type: "text",
          text: `✅ Playlist created successfully!\n\n` +
                `Title: ${playlist.snippet?.title}\n` +
                `Playlist ID: ${playlist.id}\n` +
                `Privacy: ${playlist.status?.privacyStatus}\n` +
                `URL: https://www.youtube.com/playlist?list=${playlist.id}`,
        }],
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new GoogleAPIError(`Failed to create playlist: ${error.message}`, undefined, error);
      }
      throw new GoogleAPIError(`Failed to create playlist: ${String(error)}`);
    }
  }

  /**
   * Add a video to a playlist
   */
  async addToPlaylist(auth: OAuth2Client, params: YouTubeAddToPlaylistParams) {
    validateRequired(params.playlistId, 'playlistId');
    validateRequired(params.videoId, 'videoId');

    const youtube = google.youtube({ version: "v3", auth });

    try {
      const response = await youtube.playlistItems.insert({
        part: ['snippet'],
        requestBody: {
          snippet: {
            playlistId: params.playlistId,
            resourceId: {
              kind: 'youtube#video',
              videoId: params.videoId,
            },
            ...(params.position !== undefined && { position: params.position }),
          },
        },
      });

      return {
        content: [{
          type: "text",
          text: `✅ Video added to playlist!\n\n` +
                `Video ID: ${params.videoId}\n` +
                `Playlist ID: ${params.playlistId}\n` +
                `Video URL: https://www.youtube.com/watch?v=${params.videoId}\n` +
                `Playlist URL: https://www.youtube.com/playlist?list=${params.playlistId}`,
        }],
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new GoogleAPIError(`Failed to add video to playlist: ${error.message}`, undefined, error);
      }
      throw new GoogleAPIError(`Failed to add video to playlist: ${String(error)}`);
    }
  }
}
