# cookpad-ts

Cookpad の非公開 API を叩く TypeScript クライアント。学習用です。一般公開しないでください。

Python 版 [cookpad-py](https://github.com/evex-dev/cookpad-py) の TypeScript リライト。

## 必要環境

- Node.js 18 以上（組み込み `fetch` を使用）

## インストール

```bash
npm install
npm run build
```

## 使い方

```typescript
import { Cookpad } from "cookpad-ts";

const client = new Cookpad();

// レシピ検索
const results = await client.searchRecipes("カレー", { perPage: 5 });
console.log(results.totalCount); // 98564
for (const r of results.recipes) {
  console.log(r.title, r.id);
}

// レシピ詳細
const recipe = await client.getRecipe(25557685);
console.log(recipe.title);
console.log(recipe.ingredients.map((i) => i.name));

// ユーザー検索
const users = await client.searchUsers("cook");
for (const u of users.users) {
  console.log(u.name, u.recipeCount);
}
```

## デモ

```bash
npx tsx examples/demo.ts
```

## API

### `new Cookpad(options?)`

| オプション | 型 | デフォルト |
|---|---|---|
| `token` | `string` | 組み込みトークン |
| `country` | `string` | `"JP"` |
| `language` | `string` | `"ja"` |
| `timezoneId` | `string` | `"Asia/Tokyo"` |
| `timezoneOffset` | `string` | `"+09:00"` |
| `userAgent` | `string` | 組み込み UA |
| `providerId` | `string` | `"8"` |

### メソッド

| メソッド | Python 版対応 | 戻り値 |
|---|---|---|
| `searchRecipes(query, options?)` | `search_recipes()` | `SearchResponse` |
| `getRecipe(id)` | `get_recipe()` | `Recipe` |
| `getSimilarRecipes(id, options?)` | `get_similar_recipes()` | `Recipe[]` |
| `getComments(id, options?)` | `get_comments()` | `CommentsResponse` |
| `searchUsers(query, options?)` | `search_users()` | `UsersResponse` |
| `searchKeywords(query?)` | `search_keywords()` | `object` |
| `getSearchHistory(localHistory?)` | `get_search_history()` | `object` |

## 型

```typescript
interface Recipe {
  id: number;
  title: string;
  cookingTime: string | null;
  serving: string;
  imageUrl: string | null;
  ingredients: Ingredient[];
  steps: Step[];
  user: User | null;
  viewCount: number;
  bookmarksCount: number;
  // ...
}

interface User {
  id: number;
  name: string;
  recipeCount: number;
  followerCount: number;
  // ...
}
```

## エラー

```typescript
import { AuthenticationError, NotFoundError, RateLimitError, APIError } from "cookpad-ts";

try {
  await client.getRecipe(999999999);
} catch (e) {
  if (e instanceof NotFoundError) console.log("not found");
  if (e instanceof APIError) console.log(e.statusCode);
}
```

## ライセンス

The Unlicense — 詳細は [LICENSE](LICENSE) を参照。
