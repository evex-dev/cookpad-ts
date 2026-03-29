// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = Record<string, any>;

// --- Interfaces ---

export interface Image {
  url: string;
  id: string;
  filename: string;
  altText: string | null;
}

export interface Ingredient {
  id: number;
  name: string;
  quantity: string;
  headline: boolean;
  sanitizedName: string;
}

export interface Step {
  id: number;
  description: string;
  imageUrl: string | null;
}

export interface User {
  id: number;
  name: string;
  profileMessage: string;
  imageUrl: string | null;
  recipeCount: number;
  followerCount: number;
  followeeCount: number;
  cookpadId: string;
  href: string;
}

export interface Recipe {
  id: number;
  title: string;
  story: string;
  serving: string;
  cookingTime: string | null;
  publishedAt: string;
  hallOfFame: boolean;
  cooksnapsCount: number;
  imageUrl: string | null;
  ingredients: Ingredient[];
  steps: Step[];
  user: User | null;
  advice: string;
  bookmarksCount: number;
  viewCount: number;
  commentsCount: number;
  href: string;
  country: string;
  language: string;
  premium: boolean;
}

export interface Comment {
  id: number;
  body: string;
  createdAt: string;
  label: string;
  user: User | null;
  imageUrl: string | null;
  cursor: string;
  likesCount: number;
  repliesCount: number;
}

export interface SearchResponse {
  recipes: Recipe[];
  totalCount: number;
  nextPage: number | null;
  raw: AnyObj;
}

export interface CommentsResponse {
  comments: Comment[];
  nextCursor: string | null;
}

export interface UsersResponse {
  users: User[];
  totalCount: number;
  nextPage: number | null;
}

// --- Parsers ---

export function parseImage(data: AnyObj): Image {
  return {
    url: data["url"] ?? "",
    id: String(data["id"] ?? ""),
    filename: data["filename"] ?? "",
    altText: data["alt_text"] ?? null,
  };
}

export function parseIngredient(data: AnyObj): Ingredient {
  return {
    id: data["id"] ?? 0,
    name: data["name"] ?? "",
    quantity: data["quantity"] ?? "",
    headline: data["headline"] ?? false,
    sanitizedName: data["sanitized_name"] ?? "",
  };
}

export function parseStep(data: AnyObj): Step {
  let imageUrl: string | null = null;
  for (const att of (data["attachments"] as AnyObj[]) ?? []) {
    if (att["url"]) {
      imageUrl = att["url"];
      break;
    }
    if (att["image"]?.["url"]) {
      imageUrl = att["image"]["url"];
      break;
    }
  }
  return {
    id: data["id"] ?? 0,
    description: data["description"] ?? "",
    imageUrl,
  };
}

export function parseUser(data: AnyObj): User {
  return {
    id: data["id"] ?? 0,
    name: data["name"] ?? "",
    profileMessage: data["profile_message"] ?? "",
    imageUrl: data["image"]?.["url"] ?? null,
    recipeCount: data["recipe_count"] ?? 0,
    followerCount: data["follower_count"] ?? 0,
    followeeCount: data["followee_count"] ?? 0,
    cookpadId: data["cookpad_id"] ?? "",
    href: data["href"] ?? "",
  };
}

export function parseRecipe(data: AnyObj): Recipe {
  return {
    id: data["id"] ?? 0,
    title: data["title"] ?? "",
    story: data["story"] ?? "",
    serving: data["serving"] ?? "",
    cookingTime: data["cooking_time"] ?? null,
    publishedAt: data["published_at"] ?? "",
    hallOfFame: data["hall_of_fame"] ?? false,
    cooksnapsCount: data["cooksnaps_count"] ?? 0,
    imageUrl: data["image"]?.["url"] ?? null,
    ingredients: ((data["ingredients"] as AnyObj[]) ?? []).map(parseIngredient),
    steps: ((data["steps"] as AnyObj[]) ?? []).map(parseStep),
    user: data["user"] ? parseUser(data["user"]) : null,
    advice: data["advice"] ?? "",
    bookmarksCount: data["bookmarks_count"] ?? 0,
    viewCount: data["view_count"] ?? 0,
    commentsCount: data["comments_count"] ?? 0,
    href: data["href"] ?? "",
    country: data["country"] ?? "",
    language: data["language"] ?? "",
    premium: data["premium"] ?? false,
  };
}

export function parseComment(data: AnyObj): Comment {
  return {
    id: data["id"] ?? 0,
    body: data["body"] ?? "",
    createdAt: data["created_at"] ?? "",
    label: data["label"] ?? "",
    user: data["user"] ? parseUser(data["user"]) : null,
    imageUrl: data["image"]?.["url"] ?? null,
    cursor: data["cursor"] ?? "",
    likesCount: data["likes_count"] ?? 0,
    repliesCount: data["replies_count"] ?? 0,
  };
}

export function parseSearchResponse(data: AnyObj): SearchResponse {
  const recipes = ((data["result"] as AnyObj[]) ?? [])
    .filter((item) => item["type"] === "search_results/recipe")
    .map(parseRecipe);

  const extra: AnyObj = data["extra"] ?? {};
  const totalCount: number = extra["total_count"] ?? 0;
  const nextPage: number | null = extra["links"]?.["next"]?.["page"] ?? null;

  return { recipes, totalCount, nextPage, raw: data };
}

export function parseCommentsResponse(data: AnyObj): CommentsResponse {
  const comments = ((data["result"] as AnyObj[]) ?? []).map(parseComment);
  const nextCursor = comments.at(-1)?.cursor || null;
  return { comments, nextCursor };
}

export function parseUsersResponse(data: AnyObj): UsersResponse {
  const users = ((data["result"] as AnyObj[]) ?? []).map(parseUser);
  const extra: AnyObj = data["extra"] ?? {};
  const totalCount: number = extra["total_count"] ?? 0;
  const nextPage: number | null = extra["links"]?.["next"]?.["page"] ?? null;
  return { users, totalCount, nextPage };
}
