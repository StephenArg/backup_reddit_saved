/* eslint-disable no-unused-vars */
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import {
  extractVideoInfo,
  extractAudioUrl,
  extractVideoUrl,
  hasAudioTrack,
  getAvailableResolutions,
} from './core.mjs';
import dotenv from 'dotenv';

dotenv.config();

const comments = [];
const links = [];
const redditSavedListUrl = `https://oauth.reddit.com/user/${process.env.REDDIT_USERNAME}/saved.json`;

const token = await getToken();

console.log('fetching first saved page');
let obj = await getJson(redditSavedListUrl, token);
// const currentIndex = 375; // wherever the latest point was
const currentIndex = 0;
let index = 0;

console.log(obj);

// do {
//   const pageData = obj?.data;
//   for (let i = 0; i < pageData.children.length; i++) {
//     const { kind, data } = pageData.children[i];
//     if (!data) continue;
//     if (kind === "t1") {
//       console.log(index++, "Saving comment from", data.subreddit);
//       const comment = {
//         postTitle: data.link_title,
//         subreddit: data.subreddit,
//         author: data.author,
//         body: data.body,
//         edited: data.edited,
//         permalink: `https://www.reddit.com${data.permalink}`,
//       };
//       comments.push(comment);
//       continue;
//     }
//     switch (data.post_hint) {
//       case "hosted:video":
//         if (index < currentIndex) {
//           index++;
//           continue;
//         }
//         console.log(index, "Saving video:", slugify(data.title), data.url);
//         await extractVideo(data);
//         break;
//       case "rich:video":
//         console.log(index, "Saving video link");
//         const videoLink = {
//           title: data.title,
//           subreddit: data.subreddit,
//           domain: data.domain,
//           link: data.url,
//           edited: data.edited,
//           permalink: `https://www.reddit.com${data.permalink}`,
//         };
//         links.push(videoLink);
//         break;
//       case "link":
//         console.log(index, "Saving link");
//         const link = {
//           title: data.title,
//           subreddit: data.subreddit,
//           domain: data.domain,
//           link: data.url,
//           edited: data.edited,
//           permalink: `https://www.reddit.com${data.permalink}`,
//         };
//         links.push(link);
//         break;
//       default:
//         if (index < currentIndex) {
//           index++;
//           continue;
//         }
//         console.log(index, "Started collecting post comments...");
//         await savePost(data, token);
//     }
//     index++;
//   }
//   console.log("fetching next saved page");
//   obj = await getJson(redditSavedListUrl, token, pageData.after);
// } while (obj.data.after);

// if (obj.data.children.length) {
//   const pageData = obj?.data;
//   for (let i = 0; i < pageData.children.length; i++) {
//     const { kind, data } = pageData.children[i];
//     if (!data) continue;
//     if (kind === "t1") {
//       console.log(index++, "Saving comment from", data.subreddit);
//       const comment = {
//         postTitle: data.link_title,
//         subreddit: data.subreddit,
//         author: data.author,
//         body: data.body,
//         edited: data.edited,
//         permalink: `https://www.reddit.com${data.permalink}`,
//       };
//       comments.push(comment);
//       continue;
//     }
//     switch (data.post_hint) {
//       case "hosted:video":
//         if (index < currentIndex) {
//           index++;
//           continue;
//         }
//         console.log(index, "Saving video:", slugify(data.title), data.url);
//         await extractVideo(data);
//         break;
//       case "rich:video":
//         console.log(index, "Saving video link");
//         const videoLink = {
//           title: data.title,
//           subreddit: data.subreddit,
//           domain: data.domain,
//           link: data.url,
//           edited: data.edited,
//           permalink: `https://www.reddit.com${data.permalink}`,
//         };
//         links.push(videoLink);
//         break;
//       case "link":
//         console.log(index, "Saving link");
//         const link = {
//           title: data.title,
//           subreddit: data.subreddit,
//           domain: data.domain,
//           link: data.url,
//           edited: data.edited,
//           permalink: `https://www.reddit.com${data.permalink}`,
//         };
//         links.push(link);
//         break;
//       default:
//         if (index < currentIndex) {
//           index++;
//           continue;
//         }
//         console.log(index, "Started collecting post comments...");
//         await savePost(data, token);
//     }
//     index++;
//   }
// }

// fs.writeFileSync("comments.json", JSON.stringify(comments));
// fs.writeFileSync("links.json", JSON.stringify(links));

async function getToken() {
  console.log('fetching token');
  const t = await (
    await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        Authorization:
          'Basic ' +
          btoa(`${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_SECRET}`),
      },
      body: new URLSearchParams({
        grant_type: 'password',
        username: process.env.REDDIT_USERNAME,
        password: process.env.REDDIT_PASSWORD,
      }),
    })
  ).json();

  return t;
}

async function getJson(jsonURL, t, nextPage) {
  const query = nextPage ? `?count=25&after=${nextPage}` : '';
  const url = `${jsonURL}${query}`;
  const res = await (
    await fetch(url, {
      headers: {
        Authorization: `bearer ${t.access_token}`,
        'User-Agent':
          'script:scrubSaved/1.0 (Node.js; node-fetch) by /u/basicallysteve',
        Accept: 'application/json',
      },
    })
  ).json();

  return res;
}

async function extractVideo(objData) {
  const videoInfo = await extractVideoInfo(objData);
  console.log(videoInfo);
  const id = videoInfo.url.split('/')[3];

  if (!fs.existsSync('downloads')) fs.mkdirSync('downloads');

  const filename = `${slugify(objData.title)}-${id}`;
  const outputFile = `downloads/${filename.slice(0, 245)}.mp4`;
  const command = ffmpeg();

  const resolutions = getAvailableResolutions(videoInfo);
  const resolution = resolutions[0];

  if (!resolutions.includes(resolution)) {
    console.log('Invalid resolution.');
    process.exit(-1);
  }

  command.output(outputFile).addInput(extractVideoUrl(videoInfo, resolution));

  if (await hasAudioTrack(videoInfo)) {
    console.log('Found audio track...');
    command.addInput(extractAudioUrl(videoInfo));
  }

  command.on('error', (err) => {
    console.error('Cannot download video: ');
    console.error(err);
  });

  command.on('end', () => {
    console.log(`Saved to ${outputFile}`);
  });

  command.on('progress', (data) => {
    console.log(`Status ${Math.max(0.0, data.percent.toFixed(1))}%`);
  });

  console.log('Downloading the video...');
  command.run();
}

async function savePost(data, t) {
  const post = {
    title: data.title,
    selftext: data.selftext,
    subreddit: data.subreddit,
    author: data.author,
    edited: data.edited,
    upvoteRatio: data.upvote_ratio,
    numberComments: data.num_comments,
    permalink: `https://www.reddit.com${data.permalink}`,
    comments: [],
  };

  let topLevelCommentCount = 0;
  let res = (
    await getJson(`https://oauth.reddit.com${data.permalink}.json`, t)
  )[1];

  do {
    const children = res.data.children;
    if (children.length === 0) break;
    for (let i = 0; i < children.length; i++) {
      const child = children[i].data;
      if (children[i].kind !== 't1') {
        topLevelCommentCount = 200;
        break;
      }
      const comment = {
        replies: getReplies(child?.replies?.data?.children),
        author: child.author,
        body: child.body,
        score: child.score,
        permalink: child.permalink,
        edited: child.edited,
      };
      post.comments.push(comment);
      topLevelCommentCount++;
    }
    res = (
      await getJson(
        `https://oauth.reddit.com${data.permalink}.json`,
        t,
        res.data.after
      )
    )[1];
  } while (res?.data?.after || topLevelCommentCount < 150);

  if (!fs.existsSync('posts')) fs.mkdirSync('posts');
  const filename = `${slugify(data.title)}-${data.id}`;
  console.log('Saving post', filename);
  fs.writeFileSync(
    `posts/${filename.slice(0, 245)}.json`,
    JSON.stringify(post)
  );
}

function getReplies(children) {
  if (!children) return [];
  return children.map((child) => {
    const c = child.data;
    const comment = {
      replies: getReplies(c?.replies?.data?.children),
      author: c.author,
      body: c.body,
      score: c.score,
      permalink: c.permalink,
      edited: c.edited,
    };
    return comment;
  });
}

function slugify(str) {
  str = str.replaceAll(/^\s+|\s+$/g, ''); // trim
  str = str.replaceAll(/'/g, ''); // remove apostrophes
  str = str
    .replaceAll(/(?:^\w|[A-Z]|\b\w)/g, function (char) {
      return char.toUpperCase();
    })
    .replaceAll(/\s+/g, ''); // camel case handling

  // remove accents, swap ñ for n, etc
  var from = 'àáäâèéëêìíïîòóöôùúüûñç·/_,:;',
    to = 'aaaaeeeeiiiioooouuuunc------';
  for (var i = 0, l = from.length; i < l; i++) {
    str = str.replace(from[i], to[i]);
  }

  str = str
    .replaceAll(/[^a-zA-Z0-9 -]/g, '') // remove invalid chars
    .replaceAll(/\s+/g, '-') // collapse whitespace and replace by -
    .replaceAll(/-+/g, '-'); // collapse dashes

  return str;
}
