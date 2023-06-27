export const resolutions = ["1080", "720", "480", "360", "240", "96"];

export async function extractVideoInfo(obj) {
  const mediaData = obj.media.reddit_video;
  const fallbackUrl = mediaData.fallback_url.split("?")[0];

  const info = {
    fallbackUrl,
    isMP4: fallbackUrl.endsWith(".mp4"),
    url: obj.url,
    isVideo: obj.is_video,
    duration: mediaData.duration,
  };

  return info;
  // returns Promise<VideoInfo>
}

export function extractAudioUrl(videoInfo) {
  return videoInfo.isMP4 ? `${videoInfo.url}/DASH_audio.mp4` : `${videoInfo.url}/audio`;
  // returns string
}

export async function hasAudioTrack(videoInfo) {
  const res = await fetch(extractAudioUrl(videoInfo));
  return res.status === 200;
  // returns Promise<bool>
}

export function getBestResolution(videoInfo) {
  return videoInfo.fallbackUrl.split("_")[1].split(".")[0];
  // returns string
}

export function getAvailableResolutions(videoInfo) {
  return resolutions.slice(resolutions.indexOf(getBestResolution(videoInfo)));
  // returns string[]
}

export function extractVideoUrl(videoInfo, resolution) {
  if (resolution === undefined || !videoInfo.isMP4) return videoInfo.fallbackUrl;
  if (videoInfo.isMP4) resolution += ".mp4";
  return `${videoInfo.fallbackUrl.split("_")[0]}_${resolution}`;
  // returns string
}

// export interface VideoInfo {
//   fallbackUrl: string;
//   isVideo: boolean;
//   url: string;
//   isMP4: boolean;
//   duration: number;
// }
// Promise<VideoInfo>
