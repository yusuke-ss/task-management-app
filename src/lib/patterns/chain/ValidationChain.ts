import { ValidationResult } from "../strategy/ValidationStrategy";

/**
 * Chain of Responsibility Pattern
 * リクエストを処理するハンドラーのチェーンを作成します。
 * 各ハンドラーは処理を実行するか、次のハンドラーに渡すかを決定できます。
 * バリデーションの場合、すべてのハンドラーを実行し、最初のエラーで停止します。
 */

export interface IValidationHandler {
  setNext(handler: IValidationHandler): IValidationHandler;
  handle(value: unknown, context?: ValidationContext): ValidationResult;
}

export interface ValidationContext {
  fieldName: string;
  [key: string]: unknown;
}

/**
 * AbstractValidationHandler
 * Chain of Responsibility の基底クラス
 */
export abstract class AbstractValidationHandler implements IValidationHandler {
  private nextHandler: IValidationHandler | null = null;

  setNext(handler: IValidationHandler): IValidationHandler {
    this.nextHandler = handler;
    return handler;
  }

  handle(value: unknown, context?: ValidationContext): ValidationResult {
    const result = this.validate(value, context);

    if (!result.isValid) {
      return result;
    }

    if (this.nextHandler) {
      return this.nextHandler.handle(value, context);
    }

    return { isValid: true };
  }

  protected abstract validate(value: unknown, context?: ValidationContext): ValidationResult;
}

/**
 * RequiredHandler
 * 必須チェックハンドラー
 */
export class RequiredHandler extends AbstractValidationHandler {
  protected validate(value: unknown, context?: ValidationContext): ValidationResult {
    if (value === null || value === undefined || (typeof value === "string" && value.trim() === "")) {
      return {
        isValid: false,
        error: `${context?.fieldName || "値"}は必須です`,
      };
    }
    return { isValid: true };
  }
}

/**
 * TypeHandler
 * 型チェックハンドラー
 */
export class TypeHandler extends AbstractValidationHandler {
  constructor(private expectedType: string) {
    super();
  }

  protected validate(value: unknown, context?: ValidationContext): ValidationResult {
    if (typeof value !== this.expectedType) {
      return {
        isValid: false,
        error: `${context?.fieldName || "値"}は${this.expectedType}型である必要があります`,
      };
    }
    return { isValid: true };
  }
}

/**
 * MaxLengthHandler
 * 最大文字数チェックハンドラー
 */
export class MaxLengthHandler extends AbstractValidationHandler {
  constructor(private maxLength: number) {
    super();
  }

  protected validate(value: unknown, context?: ValidationContext): ValidationResult {
    if (typeof value === "string" && value.length > this.maxLength) {
      return {
        isValid: false,
        error: `${context?.fieldName || "値"}は${this.maxLength}文字以内で入力してください`,
      };
    }
    return { isValid: true };
  }
}

/**
 * MinLengthHandler
 * 最小文字数チェックハンドラー
 */
export class MinLengthHandler extends AbstractValidationHandler {
  constructor(private minLength: number) {
    super();
  }

  protected validate(value: unknown, context?: ValidationContext): ValidationResult {
    if (typeof value === "string" && value.trim().length < this.minLength) {
      return {
        isValid: false,
        error: `${context?.fieldName || "値"}は${this.minLength}文字以上で入力してください`,
      };
    }
    return { isValid: true };
  }
}

/**
 * NumericHandler
 * 数値チェックハンドラー
 */
export class NumericHandler extends AbstractValidationHandler {
  protected validate(value: unknown, context?: ValidationContext): ValidationResult {
    const num = typeof value === "string" ? parseInt(value, 10) : value;
    if (typeof num !== "number" || isNaN(num)) {
      return {
        isValid: false,
        error: `${context?.fieldName || "値"}は有効な数値である必要があります`,
      };
    }
    return { isValid: true };
  }
}

/**
 * ValidationChainBuilder
 * Builder Pattern を使用してバリデーションチェーンを構築
 */
export class ValidationChainBuilder {
  private firstHandler: IValidationHandler | null = null;
  private lastHandler: IValidationHandler | null = null;

  addHandler(handler: IValidationHandler): this {
    if (!this.firstHandler) {
      this.firstHandler = handler;
      this.lastHandler = handler;
    } else {
      this.lastHandler!.setNext(handler);
      this.lastHandler = handler;
    }
    return this;
  }

  addRequired(): this {
    return this.addHandler(new RequiredHandler());
  }

  addType(type: string): this {
    return this.addHandler(new TypeHandler(type));
  }

  addMaxLength(maxLength: number): this {
    return this.addHandler(new MaxLengthHandler(maxLength));
  }

  addMinLength(minLength: number): this {
    return this.addHandler(new MinLengthHandler(minLength));
  }

  addNumeric(): this {
    return this.addHandler(new NumericHandler());
  }

  build(): IValidationHandler {
    if (!this.firstHandler) {
      throw new Error("バリデーションチェーンが空です");
    }
    return this.firstHandler;
  }
}
