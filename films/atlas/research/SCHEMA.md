# Research atom schema (one JSON file per batch: batch-<N>.json, an array)
Each source object:
{
 "source_id": "yt:<videoId>" | "gh:<owner/repo>" | "web:<domain>" | "drive:<folderId>" | "post:<id>",
 "url": "...",
 "kind": "video" | "short" | "repo" | "site" | "folder" | "post",
 "title": "...", "creator": "...", "published": "YYYY-MM-DD or null", "duration": "mm:ss or null",
 "summary": "2-4 sentences, YOUR OWN WORDS (no copying)",
 "what_is_shown": "the concrete motion-graphics output visible/described",
 "stack": ["Remotion","Motion Canvas","p5.js","GSAP","After Effects","Claude Code","Manim","Three.js", ...],
 "techniques": [{"name":"short noun phrase","how":"1-2 sentences, own words","quality_lever":"why it makes output look better"}],
 "prompting_patterns": ["how the creator prompts the AI model, if shown"],
 "pipeline": "idea -> ... -> render, as stated",
 "pitfalls": ["failure modes mentioned"],
 "relevance": 1-5,   // for building a Claude-driven motion-graphics skill
 "confidence": "high|medium|low",  // high only if transcript/description actually read
 "evidence": "what you actually read: transcript / description / page / repo files"
}
Rules: paraphrase everything; any quote < 15 words, max one per source. Never invent; if you cannot read a source, record title/url and set confidence low with the reason.
