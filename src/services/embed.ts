/**
 * Embedding service for Project Kalki.
 * Generates text embeddings via Google text-embedding-004 (768 dimensions)
 * and performs pgvector cosine-similarity search for characters and worlds.
 */

import { google } from "@ai-sdk/google";
import { embed } from "ai";
import { db } from "@/lib/prisma";

const EMBEDDING_MODEL = "text-embedding-004";

// ─── Generate Embedding ───────────────────────────────────────────────────────

/**
 * Generates a 768-dimensional embedding for the given text using
 * Google text-embedding-004.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: google.textEmbeddingModel(EMBEDDING_MODEL),
    value: text,
  });
  return embedding;
}

// ─── Vector formatting ─────────────────────────────────────────────────────────

function formatVector(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

// ─── Similarity Search: Characters ────────────────────────────────────────────

export interface SimilarCharacter {
  id: string;
  channelId: string;
  name: string;
  soulDocument: unknown;
  referenceUrls: string[];
  loraPath: string | null;
  createdAt: Date;
  updatedAt: Date;
  distance: number;
}

/**
 * Returns the top `limit` characters in a channel ordered by cosine distance
 * to the given embedding vector. Uses pgvector's `<=>` operator.
 */
export async function searchSimilarCharacters(
  embedding: number[],
  channelId: string,
  limit = 5,
): Promise<SimilarCharacter[]> {
  const vector = formatVector(embedding);

  const results = await db.$queryRaw<SimilarCharacter[]>`
    SELECT
      id,
      "channelId",
      name,
      "soulDocument",
      "referenceUrls",
      "loraPath",
      "createdAt",
      "updatedAt",
      embedding <=> ${vector}::vector AS distance
    FROM characters
    WHERE "channelId" = ${channelId}
      AND embedding IS NOT NULL
    ORDER BY embedding <=> ${vector}::vector
    LIMIT ${limit}
  `;

  return results;
}

// ─── Similarity Search: Worlds ────────────────────────────────────────────────

export interface SimilarWorld {
  id: string;
  channelId: string;
  name: string;
  description: string;
  visualStyle: string;
  referenceUrls: string[];
  createdAt: Date;
  updatedAt: Date;
  distance: number;
}

/**
 * Returns the top `limit` worlds in a channel ordered by cosine distance
 * to the given embedding vector. Uses pgvector's `<=>` operator.
 */
export async function searchSimilarWorlds(
  embedding: number[],
  channelId: string,
  limit = 5,
): Promise<SimilarWorld[]> {
  const vector = formatVector(embedding);

  const results = await db.$queryRaw<SimilarWorld[]>`
    SELECT
      id,
      "channelId",
      name,
      description,
      "visualStyle",
      "referenceUrls",
      "createdAt",
      "updatedAt",
      embedding <=> ${vector}::vector AS distance
    FROM worlds
    WHERE "channelId" = ${channelId}
      AND embedding IS NOT NULL
    ORDER BY embedding <=> ${vector}::vector
    LIMIT ${limit}
  `;

  return results;
}
