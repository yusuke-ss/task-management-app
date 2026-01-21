import { NextResponse } from "next/server";

/**
 * Decorator Pattern
 * オブジェクトに動的に新しい責任を追加します。
 * 機能拡張のための柔軟な代替手段を提供します。
 */

export interface ApiResponse<T = unknown> {
  toNextResponse(): NextResponse;
}

/**
 * BaseResponse
 * 基本的なレスポンスクラス
 */
export class BaseResponse<T> implements ApiResponse<T> {
  constructor(
    protected data: T,
    protected status: number = 200
  ) {}

  toNextResponse(): NextResponse {
    return NextResponse.json(this.data, { status: this.status });
  }
}

/**
 * ResponseDecorator
 * レスポンスデコレーターの抽象クラス
 */
export abstract class ResponseDecorator<T> implements ApiResponse<T> {
  constructor(protected response: ApiResponse<T>) {}

  abstract toNextResponse(): NextResponse;
}

/**
 * TimestampDecorator
 * タイムスタンプを追加するデコレーター
 */
export class TimestampDecorator<T> extends ResponseDecorator<T> {
  toNextResponse(): NextResponse {
    const originalResponse = this.response.toNextResponse();
    const body = originalResponse.body;

    // Clone the response to modify it
    return NextResponse.json(
      {
        ...(typeof body === 'string' ? JSON.parse(body) : body),
        timestamp: new Date().toISOString(),
      },
      { status: originalResponse.status }
    );
  }
}

/**
 * MetadataDecorator
 * メタデータを追加するデコレーター
 */
export class MetadataDecorator<T> extends ResponseDecorator<T> {
  constructor(
    response: ApiResponse<T>,
    private metadata: Record<string, unknown>
  ) {
    super(response);
  }

  toNextResponse(): NextResponse {
    const originalResponse = this.response.toNextResponse();
    const body = originalResponse.body;

    return NextResponse.json(
      {
        ...(typeof body === 'string' ? JSON.parse(body) : body),
        metadata: this.metadata,
      },
      { status: originalResponse.status }
    );
  }
}

/**
 * CacheDecorator
 * キャッシュヘッダーを追加するデコレーター
 */
export class CacheDecorator<T> extends ResponseDecorator<T> {
  constructor(
    response: ApiResponse<T>,
    private maxAge: number = 300
  ) {
    super(response);
  }

  toNextResponse(): NextResponse {
    const originalResponse = this.response.toNextResponse();

    originalResponse.headers.set(
      "Cache-Control",
      `public, max-age=${this.maxAge}, s-maxage=${this.maxAge}`
    );

    return originalResponse;
  }
}

/**
 * SuccessResponse
 * 成功レスポンス用のクラス
 */
export class SuccessResponse<T> extends BaseResponse<T> {
  constructor(data: T, status: number = 200) {
    super(data, status);
  }
}

/**
 * ErrorResponse
 * エラーレスポンス用のクラス
 */
export class ErrorResponse extends BaseResponse<{ error: string }> {
  constructor(error: string, status: number = 500) {
    super({ error }, status);
  }
}

/**
 * CreatedResponse
 * 作成成功レスポンス用のクラス
 */
export class CreatedResponse<T> extends BaseResponse<T> {
  constructor(data: T) {
    super(data, 201);
  }
}

/**
 * NotFoundResponse
 * 404レスポンス用のクラス
 */
export class NotFoundResponse extends ErrorResponse {
  constructor(message: string = "リソースが見つかりません") {
    super(message, 404);
  }
}

/**
 * BadRequestResponse
 * 400レスポンス用のクラス
 */
export class BadRequestResponse extends ErrorResponse {
  constructor(message: string) {
    super(message, 400);
  }
}

/**
 * ResponseBuilder
 * Builder Pattern を組み合わせたレスポンス構築
 */
export class ResponseBuilder<T> {
  private response: ApiResponse<T> | null = null;

  success(data: T, status: number = 200): this {
    this.response = new SuccessResponse(data, status);
    return this;
  }

  created(data: T): this {
    this.response = new CreatedResponse(data);
    return this;
  }

  error(message: string, status: number = 500): this {
    this.response = new ErrorResponse(message, status) as unknown as ApiResponse<T>;
    return this;
  }

  notFound(message?: string): this {
    this.response = new NotFoundResponse(message) as unknown as ApiResponse<T>;
    return this;
  }

  badRequest(message: string): this {
    this.response = new BadRequestResponse(message) as unknown as ApiResponse<T>;
    return this;
  }

  withTimestamp(): this {
    if (!this.response) {
      throw new Error("レスポンスが設定されていません");
    }
    this.response = new TimestampDecorator(this.response);
    return this;
  }

  withMetadata(metadata: Record<string, unknown>): this {
    if (!this.response) {
      throw new Error("レスポンスが設定されていません");
    }
    this.response = new MetadataDecorator(this.response, metadata);
    return this;
  }

  withCache(maxAge: number = 300): this {
    if (!this.response) {
      throw new Error("レスポンスが設定されていません");
    }
    this.response = new CacheDecorator(this.response, maxAge);
    return this;
  }

  build(): NextResponse {
    if (!this.response) {
      throw new Error("レスポンスが設定されていません");
    }
    return this.response.toNextResponse();
  }
}

/**
 * ResponseFactory
 * Factory Pattern を使ったレスポンス生成
 */
export class ResponseFactory {
  static success<T>(data: T, status: number = 200): NextResponse {
    return new SuccessResponse(data, status).toNextResponse();
  }

  static created<T>(data: T): NextResponse {
    return new CreatedResponse(data).toNextResponse();
  }

  static error(message: string, status: number = 500): NextResponse {
    return new ErrorResponse(message, status).toNextResponse();
  }

  static notFound(message?: string): NextResponse {
    return new NotFoundResponse(message).toNextResponse();
  }

  static badRequest(message: string): NextResponse {
    return new BadRequestResponse(message).toNextResponse();
  }
}
