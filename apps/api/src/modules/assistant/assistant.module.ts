import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Injectable,
  Logger,
  Module,
  OnModuleInit,
  Post,
  Req,
  Res
} from "@nestjs/common";
import type { Request, Response } from "express";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { PrismaService } from "../../common/prisma/prisma.service";
import {
  ASSISTANT_MODEL,
  cleanMessages,
  KEEP_ALIVE,
  OLLAMA_BASE_URL,
  streamOllamaChat,
  type ChatMessage
} from "../../common/ollama";

const MAX_TURNS = 12;
const MAX_MESSAGE_CHARS = 2000;

interface AssistantChatBody {
  bookSlug?: string;
  chapterId?: string;
  positionSeconds?: number;
  mode?: "text" | "voice";
  messages?: ChatMessage[];
}

function clock(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

@Injectable()
class AssistantService implements OnModuleInit {
  private readonly logger = new Logger("Assistant");

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  onModuleInit() {
    // Warm the model in the background so the first listener question is fast.
    void fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: ASSISTANT_MODEL, prompt: "", keep_alive: KEEP_ALIVE })
    })
      .then(() => this.logger.log(`${ASSISTANT_MODEL} warmed via Ollama`))
      .catch(() => this.logger.warn(`Ollama not reachable at ${OLLAMA_BASE_URL}; assistant will be unavailable`));
  }

  async health() {
    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
      const { models } = (await response.json()) as { models: Array<{ name: string }> };
      return { ok: models.some((model) => model.name === ASSISTANT_MODEL), model: ASSISTANT_MODEL };
    } catch {
      return { ok: false, model: ASSISTANT_MODEL };
    }
  }

  // Validated by hand: the tsx dev runner drops decorator metadata, so ValidationPipe can't see a DTO here.
  parse(body: AssistantChatBody) {
    const clean = cleanMessages(body?.messages, MAX_TURNS, MAX_MESSAGE_CHARS);
    if (!clean) {
      throw new BadRequestException("Ask a question to get started");
    }

    return {
      messages: clean,
      bookSlug: typeof body.bookSlug === "string" ? body.bookSlug : undefined,
      chapterId: typeof body.chapterId === "string" ? body.chapterId : undefined,
      positionSeconds: Number.isFinite(body.positionSeconds) ? Number(body.positionSeconds) : undefined,
      mode: body.mode === "voice" ? ("voice" as const) : ("text" as const)
    };
  }

  async systemPrompt(input: ReturnType<AssistantService["parse"]>) {
    const book = input.bookSlug
      ? await this.prisma.audiobook.findUnique({
          where: { slug: input.bookSlug },
          include: {
            authors: { include: { author: true } },
            narrators: { include: { narrator: true } },
            category: true,
            chapters: { orderBy: [{ sortOrder: "asc" }, { chapterNumber: "asc" }] }
          }
        })
      : null;

    const lines = [
      "You are the Lisbook listening companion: a curious, warm and precise guide who helps people understand the audiobook they are listening to.",
      "Explain complex ideas in plain language, use vivid everyday analogies, and stay faithful to what the author actually argued.",
      "When you describe the author's views, attribute them clearly and do not invent quotations. If you are not sure what the book says, say so honestly and offer what is generally known instead.",
      "You do not have the transcript of the audio, so never claim to know the exact words just spoken.",
      "Keep the conversation going naturally: when it helps, end with one short follow-up idea or question the listener might find interesting."
    ];

    if (input.mode === "voice") {
      lines.push(
        "This answer will be read aloud. Reply in 2 to 4 short conversational sentences. Do not use markdown, bullet points, headings, emoji or symbols."
      );
    } else {
      lines.push("Reply concisely: usually 2 to 5 sentences. Use a short bullet list only when it genuinely helps. Light markdown (bold, bullets) is fine.");
    }

    if (book) {
      const author = book.authors.map((a) => a.author.name).join(", ") || "an unknown author";
      const chapter = book.chapters.find((c) => c.id === input.chapterId);
      lines.push(
        "",
        "Listening context:",
        `- Book: "${book.title}" by ${author}${book.category ? ` (${book.category.name})` : ""}.`,
        book.narrators.length ? `- Narrated by ${book.narrators.map((n) => n.narrator.name).join(", ")}.` : "",
        `- Lisbook description: ${book.shortDescription ?? book.description}`,
        book.chapters.length
          ? `- Chapters: ${book.chapters.map((c) => `${c.chapterNumber}. ${c.title}`).join("; ")}.`
          : "",
        chapter
          ? `- The listener is currently in chapter ${chapter.chapterNumber}, "${chapter.title}"${
              input.positionSeconds !== undefined ? `, about ${clock(input.positionSeconds)} in` : ""
            }.${chapter.description ? ` Chapter summary: ${chapter.description}` : ""}`
          : ""
      );
    } else {
      lines.push("", "The listener has not opened a specific book. Help them with general questions about books and ideas.");
    }

    return lines.filter((line) => line !== "").join("\n");
  }

  async stream(body: AssistantChatBody, req: Request, res: Response) {
    const input = this.parse(body);
    const system = await this.systemPrompt(input);
    await streamOllamaChat(res, { system, messages: input.messages, temperature: 0.6, numCtx: 4096, logger: this.logger });
  }
}

@Controller("assistant")
class AssistantController {
  constructor(@Inject(AssistantService) private readonly assistant: AssistantService) {}

  @Get("health")
  health() {
    return this.assistant.health();
  }

  @Post("chat")
  async chat(@Body() body: AssistantChatBody, @Req() req: Request, @Res() res: Response) {
    await this.assistant.stream(body, req, res);
  }
}

@Module({
  imports: [PrismaModule],
  controllers: [AssistantController],
  providers: [AssistantService]
})
export class AssistantModule {}
