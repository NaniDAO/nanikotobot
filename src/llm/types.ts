import { z } from "zod";

export const discordActionEnum = z.enum(["[IGNORE]", "[REACT]", "[REPLY]"]);

export const discordReactionEnum = z.enum([
  // Core ironic reactions
  "💀", // NAUR/I'M DECEASED
  "😭", // CRYING/SOBBING/REAL
  "💅", // period/slay/toxic
  "✨", // girlboss/manipulator energy
  "😩", // down bad/suffering
  "🤪", // unhinged behavior
  "💁‍♀️", // excuse me/um actually
  "🙄", // rolling eyes at touch grass comments
  "🤡", // circus moments/self-aware
  "👁️", // seeing things/cursed

  // Chronically online essentials
  "🥺", // bottom text/pleading
  "😌", // as they should/material gworl
  "👀", // spilling tea/drama
  "🤨", // caught in 4k
  "😳", // ayoo/sus behavior
  "🗿", // bruh/dead inside
  "😏", // real ones know
  "🤭", // getting away with it

  // New age
  "🫶", // real/based
  "💯", // no cap fr fr
  "🔥", // ATE/slay
  "🤌", // peak behavior
  "🫡", // yes queen
  "🫢", // omg spill
  "🫣", // looking respectfully
  "🥹", // crying but like ironically
  "😮‍💨", // exhausted from slaying
  "😤", // on god/fr fr
  "🦋", // butterfly/transformation arc
  "🐸", // tea/drama
  "⚠️", // trigger warning (ironically)
  "🚩", // red flag behavior
  "💋", // muah/kiss emoji (deranged)
  "🙈", // not me doing this
  "🤷‍♀️", // idk and idc energy
  "💁", // and what about it
]);

export type TwitterActionContext = {
  likes: number;
  retweets: number;
  replies: number;
};

export const twitterActionEnum = z.enum([
  "[IGNORE]",
  "[LIKE]",
  "[REPLY]",
  "[RETWEET]",
  "[QUOTE]",
  "[BLOCK]",
  "[FOLLOW]",
]);
