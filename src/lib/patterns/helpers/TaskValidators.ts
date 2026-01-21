import { ValidationChainBuilder } from "../chain/ValidationChain";
import { ValidationResult } from "../strategy/ValidationStrategy";

/**
 * タスクバリデーション用のヘルパー関数
 * Chain of Responsibility Pattern と Strategy Pattern を組み合わせて使用
 */

export class TaskValidators {
  /**
   * タイトルのバリデーションチェーン
   */
  static validateTitle(title: unknown): ValidationResult {
    const chain = new ValidationChainBuilder()
      .addRequired()
      .addType("string")
      .addMaxLength(100)
      .build();

    return chain.handle(title, { fieldName: "タイトル" });
  }

  /**
   * 説明のバリデーションチェーン（オプショナル）
   */
  static validateDescription(description: unknown): ValidationResult {
    // 説明が null または undefined の場合は有効
    if (description === null || description === undefined) {
      return { isValid: true };
    }

    // 空文字列も許可
    if (description === "") {
      return { isValid: true };
    }

    const chain = new ValidationChainBuilder()
      .addType("string")
      .addMaxLength(500)
      .build();

    return chain.handle(description, { fieldName: "説明" });
  }

  /**
   * タスクIDのバリデーション
   */
  static validateTaskId(id: unknown): ValidationResult {
    const chain = new ValidationChainBuilder()
      .addRequired()
      .addNumeric()
      .build();

    const result = chain.handle(id, { fieldName: "タスクID" });
    if (!result.isValid) {
      return result;
    }

    const numId = typeof id === "string" ? parseInt(id, 10) : id;
    if (typeof numId === "number" && numId <= 0) {
      return {
        isValid: false,
        error: "タスクIDは正の数である必要があります",
      };
    }

    return { isValid: true };
  }

  /**
   * タスク作成・更新用の統合バリデーション
   */
  static validateTaskInput(title: unknown, description: unknown): ValidationResult {
    // タイトルのバリデーション
    const titleResult = this.validateTitle(title);
    if (!titleResult.isValid) {
      return titleResult;
    }

    // 説明のバリデーション
    const descriptionResult = this.validateDescription(description);
    if (!descriptionResult.isValid) {
      return descriptionResult;
    }

    return { isValid: true };
  }

  /**
   * 並び替えデータのバリデーション
   */
  static validateReorderData(
    data: unknown
  ): ValidationResult {
    if (!Array.isArray(data)) {
      return {
        isValid: false,
        error: "並び替えデータは配列である必要があります",
      };
    }

    for (const item of data) {
      if (typeof item !== "object" || item === null) {
        return {
          isValid: false,
          error: "並び替えデータの各要素はオブジェクトである必要があります",
        };
      }

      const { id, sortOrder } = item as Record<string, unknown>;

      const idResult = this.validateTaskId(id);
      if (!idResult.isValid) {
        return idResult;
      }

      if (typeof sortOrder !== "number" || sortOrder < 0) {
        return {
          isValid: false,
          error: "sortOrderは0以上の数値である必要があります",
        };
      }
    }

    return { isValid: true };
  }
}
