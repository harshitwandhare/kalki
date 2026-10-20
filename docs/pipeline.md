# The pipeline

A reel is one run through a five-node LangGraph graph in `src/agents/director.ts`. The nodes share one state object, write an `AgentLog` row when they start and finish, and emit SSE events so the dashboard can follow along.

## Director

Reads the prompt and loads the channel, its characters and its world. It researches the topic with Gemini so the script has current context. Every text call goes through `invokeWithFallback()`, which calls Gemini 2.5 Pro and asks for JSON back.

## Screenwriter

Writes the script as JSON: a title, a hook, a list of scenes with visual prompts, emotional tags, a target length, an audio style and the voiceover text. A second call writes platform metadata (title, description, tags, category and audience age). Both are saved on the reel.

## Artist

Generates one image per scene with Stability AI in the chosen style, plus a thumbnail from the first scene's prompt. A scene that fails gets a placeholder so the run can continue.

## Animator

Sends the scene images to Seedance 2.0 with up to 12 character reference images attached, so recurring characters keep their look. If Seedance is not configured or fails, Kling is tried. With no video key, the stage is skipped.

## Producer

Runs three FFmpeg passes:

1. Merge the clips with the ElevenLabs voiceover into an H.264 and AAC MP4.
2. Write provenance tags into the container: `comment=AI-generated content (created with Kalki)` and `encoder=Kalki`.
3. Cut a thumbnail from the first second.

The reel then moves to `READY` with its video path, thumbnail and metadata.

## Statuses

`PENDING`, then `SCRIPTING`, `GENERATING_IMAGES`, `ANIMATING`, `POST_PRODUCTION` and finally `READY`. Any stage can end the run as `FAILED`, with the error kept in `pipelineState`.
