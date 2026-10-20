# Publishing everywhere

Every reel Kalki makes is a 9:16 MP4 (H.264 video, AAC audio, fast-start), which every major short-video platform accepts as is. What changes from platform to platform is the caption, the hashtag etiquette and where the AI disclosure lives.

## From the Library

Open **Library**, find a reel marked Ready and use the publish panel:

1. Pick a platform.
2. **Copy caption** puts a caption on your clipboard that fits that platform's limits, with the title split out where the platform has a title field. Every caption ends with "Made with AI." and the reel's tags as hashtags.
3. **Download MP4** saves the file.
4. **Open** takes you to the platform's upload page. The line under the buttons tells you where that platform's AI disclosure switch is.

Upload stays manual on purpose, so you watch the reel once more and agree to each platform's terms yourself.

## Platforms

| Platform           | Title field          | Caption we produce | Hashtags we add | AI disclosure                                    |
| ------------------ | -------------------- | ------------------ | --------------- | ------------------------------------------------ |
| YouTube Shorts     | up to 100 characters | up to 5,000        | 3               | "Altered or synthetic content" in upload details |
| TikTok             | none                 | up to 2,200        | 5               | "AI-generated content" under More options        |
| Instagram Reels    | none                 | up to 2,200        | 5               | "AI label" in Advanced settings                  |
| Facebook Reels     | none                 | up to 2,200        | 5               | "AI info" label                                  |
| Snapchat Spotlight | none                 | up to 160          | 3               | Say so in the caption                            |
| Pinterest          | up to 100 characters | up to 500          | 5               | Say so in the description                        |
| X                  | none                 | up to 280          | 2               | Say so in the post                               |
| LinkedIn           | none                 | up to 3,000        | 3               | Say so in the post                               |

These limits are set a little below what each platform allows, so a generated caption never gets cut off. The presets live in `src/lib/platforms.ts`, and `tests/platforms.test.ts` checks every caption against them. Adding a platform takes one entry in that file.

## Length

Pick the length on **Generate**: 30, 45, 60, 75 or 90 seconds. The Screenwriter writes to that length. TikTok's Creator Rewards only counts videos longer than one minute, so use 75 or 90 seconds there. See [Earning with Kalki](/docs/earning) for the details of each program.

## Why there is no auto-posting

Posting through platform APIs needs an approved developer app per platform, OAuth tokens stored on your server, and app review that often bars automated AI content. It also takes the human review step out of the loop, and that review is what keeps a channel monetizable. Kalki leaves the last click to you.
