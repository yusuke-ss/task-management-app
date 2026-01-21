/**
 * Strategy Pattern
 * アルゴリズムのファミリーを定義し、それぞれをカプセル化して交換可能にします。
 * バリデーションロジックを戦略として実装することで、
 * 新しいバリデーションルールの追加や変更が容易になります。
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface IValidationStrategy {
  validate(value: unknown): ValidationResult;
}

/**
 * RequiredValidationStrategy
 * 必須チェック戦略
 */
export class RequiredValidationStrategy implements IValidationStrategy {
  constructor(private fieldName: string) {}

  validate(value: unknown): ValidationResult {
    if (!value || (typeof value === "string" && value.trim() === "")) {
      return {
        isValid: false,
        error: `${this.fieldName}は必須です`,
      };
    }
    return { isValid: true };
  }
}

/**
 * TypeValidationStrategy
 * 型チェック戦略
 */
export class TypeValidationStrategy implements IValidationStrategy {
  constructor(
    private expectedType: string,
    private fieldName: string
  ) {}

  validate(value: unknown): ValidationResult {
    if (typeof value !== this.expectedType) {
      return {
        isValid: false,
        error: `${this.fieldName}は${this.expectedType}型である必要があります`,
      };
    }
    return { isValid: true };
  }
}

/**
 * MaxLengthValidationStrategy
 * 最大文字数チェック戦略
 */
export class MaxLengthValidationStrategy implements IValidationStrategy {
  constructor(
    private maxLength: number,
    private fieldName: string
  ) {}

  validate(value: unknown): ValidationResult {
    if (typeof value === "string" && value.length > this.maxLength) {
      return {
        isValid: false,
        error: `${this.fieldName}は${this.maxLength}文字以内で入力してください`,
      };
    }
    return { isValid: true };
  }
}

/**
 * MinLengthValidationStrategy
 * 最小文字数チェック戦略
 */
export class MinLengthValidationStrategy implements IValidationStrategy {
  constructor(
    private minLength: number,
    private fieldName: string
  ) {}

  validate(value: unknown): ValidationResult {
    if (typeof value === "string" && value.trim().length < this.minLength) {
      return {
        isValid: false,
        error: `${this.fieldName}は${this.minLength}文字以上で入力してください`,
      };
    }
    return { isValid: true };
  }
}

/**
 * NumericValidationStrategy
 * 数値チェック戦略
 */
export class NumericValidationStrategy implements IValidationStrategy {
  constructor(private fieldName: string) {}

  validate(value: unknown): ValidationResult {
    const num = typeof value === "string" ? parseInt(value, 10) : value;
    if (typeof num !== "number" || isNaN(num)) {
      return {
        isValid: false,
        error: `${this.fieldName}は有効な数値である必要があります`,
      };
    }
    return { isValid: true };
  }
}

/**
 * RangeValidationStrategy
 * 範囲チェック戦略
 */
export class RangeValidationStrategy implements IValidationStrategy {
  constructor(
    private min: number,
    private max: number,
    private fieldName: string
  ) {}

  validate(value: unknown): ValidationResult {
    const num = typeof value === "number" ? value : parseInt(String(value), 10);
    if (isNaN(num) || num < this.min || num > this.max) {
      return {
        isValid: false,
        error: `${this.fieldName}は${this.min}から${this.max}の範囲である必要があります`,
      };
    }
    return { isValid: true };
  }
}

/**
 * CompositeValidationStrategy
 * 複数の戦略を組み合わせる（Composite Pattern）
 */
export class CompositeValidationStrategy implements IValidationStrategy {
  private strategies: IValidationStrategy[] = [];

  addStrategy(strategy: IValidationStrategy): this {
    this.strategies.push(strategy);
    return this;
  }

  validate(value: unknown): ValidationResult {
    for (const strategy of this.strategies) {
      const result = strategy.validate(value);
      if (!result.isValid) {
        return result;
      }
    }
    return { isValid: true };
  }
}
