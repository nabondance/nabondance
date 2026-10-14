// Rebuilds the talks list in README.md (between the TALKS markers) from talks.json.
// Also used by nabondance.me, which reads talks.json directly.
import { readFileSync, writeFileSync } from "node:fs";

const EMOJI_BASE =
  "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// Keep in sync with the flags on nabondance.me (src/app/talks/page.tsx).
const LANGUAGES = ["en", "fr"];
const START = "<!--TALKS:start-->";
const END = "<!--TALKS:end-->";

const { events, talks } = JSON.parse(readFileSync("talks.json", "utf8"));

const escape = (text) =>
  text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

const emoji = (path) =>
  `<img src="${EMOJI_BASE}${encodeURI(path)}.png" alt="${path.split("/").pop()}" width="25" height="25" />`;

const link = (href, text) => `<a href="${escape(href)}">${escape(text)}</a>`;

const renderTalk = (talk, index) => {
  const where = `talks[${index}] "${talk.title}"`;
  const event = events[talk.event];
  if (!event) throw new Error(`${where}: unknown event "${talk.event}"`);
  const match = /^(\d{4})(?:-(0[1-9]|1[0-2]))?$/.exec(talk.date ?? "");
  if (!match) throw new Error(`${where}: date must be YYYY or YYYY-MM, got "${talk.date}"`);
  if (!talk.slides && !talk.repo) throw new Error(`${where}: needs slides or repo`);
  if (!LANGUAGES.includes(talk.lang)) {
    throw new Error(`${where}: lang must be one of ${LANGUAGES.join(", ")}, got "${talk.lang}"`);
  }

  const [, year, month] = match;
  const when = [month && MONTHS[Number(month) - 1], year.slice(2)].filter(Boolean).join(" ");
  let line = `${emoji(event.emoji)} At ${escape(event.name)} ${when}: `;
  line += link(talk.slides ?? talk.repo, talk.title);
  if (talk.slides && talk.repo) line += `  ${emoji("Objects/Laptop")} ${link(talk.repo, "code")}`;
  if (talk.video) line += `  ${emoji("Objects/Film Projector")} ${link(talk.video, "video")}`;
  return `    <li>${line}</li>`;
};

const block = [
  START,
  '<ul style="list-style-type: none;">',
  ...talks.map(renderTalk),
  "</ul>",
  END,
].join("\n");

const readme = readFileSync("README.md", "utf8");
const start = readme.indexOf(START);
const end = readme.indexOf(END);
if (start === -1 || end === -1) throw new Error(`README.md must contain ${START} and ${END}`);

writeFileSync("README.md", readme.slice(0, start) + block + readme.slice(end + END.length));
