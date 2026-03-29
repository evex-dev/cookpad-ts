import { randomUUID } from "crypto";
import {
  API_HOST,
  BASE_URL,
  DEFAULT_COUNTRY,
  DEFAULT_LANGUAGE,
  DEFAULT_PROVIDER_ID,
  DEFAULT_TIMEZONE_ID,
  DEFAULT_TIMEZONE_OFFSET,
  DEFAULT_TOKEN,
  DEFAULT_USER_AGENT,
  SUPPORTED_SEARCH_TYPES,
} from "./constants.js";
import {
  APIError,
  AuthenticationError,
  NotFoundError,
  RateLimitError,
} from "./errors.js";
import {
  type CommentsResponse,
  type Recipe,
  type SearchResponse,
  type UsersResponse,
  parseCommentsResponse,
  parseRecipe,
  parseSearchResponse,
  parseUsersResponse,
} from "./types.js";

export interface CookpadOptions {
  token?: string;
  country?: string;
  language?: string;
  timezoneId?: string;
  timezoneOffset?: string;
  userAgent?: string;
  providerId?: string;
}

export interface SearchRecipesOptions {
  page?: number;
  perPage?: number;
  order?: "recent" | "popular" | "date";
  mustHaveCooksnaps?: boolean;
  minimumCooksnaps?: number;
  mustHavePhotoInSteps?: boolean;
  includedIngredients?: string;
  excludedIngredients?: string;
}

export interface PaginationOptions {
  page?: number;
  perPage?: number;
}

export interface GetCommentsOptions {
  limit?: number;
  after?: string;
  label?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = Record<string, any>;

export class Cookpad {
  private readonly token: string;
  private readonly country: string;
  private readonly language: string;
  private readonly timezoneId: string;
  private readonly timezoneOffset: string;
  private readonly userAgent: string;
  private readonly providerId: string;

  constructor(options: CookpadOptions = {}) {
    this.token = options.token ?? DEFAULT_TOKEN;
    this.country = options.country ?? DEFAULT_COUNTRY;
    this.language = options.language ?? DEFAULT_LANGUAGE;
    this.timezoneId = options.timezoneId ?? DEFAULT_TIMEZONE_ID;
    this.timezoneOffset = options.timezoneOffset ?? DEFAULT_TIMEZONE_OFFSET;
    this.userAgent = options.userAgent ?? DEFAULT_USER_AGENT;
    this.providerId = options.providerId ?? DEFAULT_PROVIDER_ID;
  }

  private headers(): Record<string, string> {
    return {
      Host: API_HOST,
      Authorization: `Bearer ${this.token}`,
      "X-Cookpad-Country-Selected": this.country,
      "X-Cookpad-Timezone-Id": this.timezoneId,
      "X-Cookpad-Provider-Id": this.providerId,
      "X-Cookpad-Timezone-Offset": this.timezoneOffset,
      "X-Cookpad-Guid": randomUUID().toUpperCase(),
      "Accept-Encoding": "gzip",
      "Accept-Language": this.language,
      Accept: "*/*",
      "User-Agent": this.userAgent,
    };
  }

  private async request(
    path: string,
    params?: Record<string, string | number | boolean>,
  ): Promise<AnyObj> {
    const url = new URL(`${BASE_URL}${path}`);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, String(v));
      }
    }

    const resp = await fetch(url.toString(), { headers: this.headers() });

    if (resp.status === 401) throw new AuthenticationError();
    if (resp.status === 404) throw new NotFoundError(`Not found: ${path}`);
    if (resp.status === 429) throw new RateLimitError();
    if (resp.status >= 400) {
      throw new APIError(
        `API error (${resp.status}): ${await resp.text()}`,
        resp.status,
      );
    }

    return resp.json() as Promise<AnyObj>;
  }

  /** レシピ検索 */
  async searchRecipes(
    query: string,
    options: SearchRecipesOptions = {},
  ): Promise<SearchResponse> {
    const {
      page = 1,
      perPage = 30,
      order = "recent",
      mustHaveCooksnaps = false,
      minimumCooksnaps = 0,
      mustHavePhotoInSteps = false,
      includedIngredients,
      excludedIngredients,
    } = options;

    const params: Record<string, string | number | boolean> = {
      query,
      page,
      per_page: perPage,
      order,
      must_have_cooksnaps: mustHaveCooksnaps,
      minimum_number_of_cooksnaps: minimumCooksnaps,
      must_have_photo_in_steps: mustHavePhotoInSteps,
      from_delicious_ways: false,
      search_source: "recipe.search.typed_query",
      supported_types: SUPPORTED_SEARCH_TYPES,
    };
    if (includedIngredients) params["included_ingredients"] = includedIngredients;
    if (excludedIngredients) params["excluded_ingredients"] = excludedIngredients;

    const data = await this.request("/search_results", params);
    return parseSearchResponse(data);
  }

  /** レシピ詳細取得 */
  async getRecipe(recipeId: number): Promise<Recipe> {
    const data = await this.request(`/recipes/${recipeId}`);
    return parseRecipe(data["result"]);
  }

  /** 類似レシピ取得 */
  async getSimilarRecipes(
    recipeId: number,
    options: PaginationOptions = {},
  ): Promise<Recipe[]> {
    const { page = 1, perPage = 30 } = options;
    const data = await this.request(`/recipes/${recipeId}/similar_recipes`, {
      page,
      per_page: perPage,
    });
    return ((data["result"] as AnyObj[]) ?? []).map(parseRecipe);
  }

  /** コメント（クックスナップ）取得 */
  async getComments(
    recipeId: number,
    options: GetCommentsOptions = {},
  ): Promise<CommentsResponse> {
    const { limit = 20, after = "", label = "cooksnap" } = options;
    const data = await this.request(`/recipes/${recipeId}/comments`, {
      limit,
      after,
      label,
    });
    return parseCommentsResponse(data);
  }

  /** ユーザー検索 */
  async searchUsers(
    query: string,
    options: PaginationOptions = {},
  ): Promise<UsersResponse> {
    const { page = 1, perPage = 20 } = options;
    const data = await this.request("/users", {
      query,
      page,
      per_page: perPage,
    });
    return parseUsersResponse(data);
  }

  /** 検索キーワードサジェスト */
  async searchKeywords(query = ""): Promise<AnyObj> {
    const data = await this.request("/search_keywords", { query });
    return (data["result"] as AnyObj) ?? {};
  }

  /** 検索履歴 / トレンドキーワード */
  async getSearchHistory(localHistory: string[] = []): Promise<AnyObj> {
    const data = await this.request("/search_history", {
      local_search_history: JSON.stringify(localHistory),
    });
    return data;
  }
}
