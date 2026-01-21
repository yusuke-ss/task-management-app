# GoFデザインパターン適用ドキュメント

このドキュメントでは、タスク管理アプリに適用したGoF（Gang of Four）デザインパターンについて説明します。

## 適用したパターン一覧

### 1. Repository Pattern（リポジトリパターン）

**分類**: データアクセスパターン（GoF外だが、重要な設計パターン）

**場所**: `src/lib/patterns/repository/TaskRepository.ts`

**目的**: データアクセス層を抽象化し、ビジネスロジックとデータ永続化を分離

**実装詳細**:
- `ITaskRepository` インターフェースでデータアクセスメソッドを定義
- `PrismaTaskRepository` クラスで具体的な実装を提供
- データソースの変更（例: PrismaからTypeORMへ）が容易

**利点**:
- テストが容易（モックリポジトリの作成が簡単）
- データアクセスロジックの一元管理
- 関心の分離（Separation of Concerns）

```typescript
// 使用例
const repository = getTaskRepository();
const tasks = await repository.findAll();
```

---

### 2. Singleton Pattern（シングルトンパターン）

**分類**: 生成パターン（Creational Pattern）

**場所**:
- `src/lib/patterns/repository/TaskRepository.ts`
- `src/lib/patterns/factory/TaskFactory.ts`
- `src/lib/prisma.ts`

**目的**: クラスのインスタンスが1つだけ存在することを保証

**実装詳細**:
- リポジトリインスタンスのシングルトン化
- Prismaクライアントのシングルトン化
- ファクトリープロバイダーのシングルトン化

**利点**:
- リソースの効率的な使用
- グローバルなアクセスポイント
- 状態の一貫性保持

```typescript
// 使用例
const repository = getTaskRepository(); // 常に同じインスタンス
```

---

### 3. Factory Pattern（ファクトリーパターン）

**分類**: 生成パターン（Creational Pattern）

**場所**:
- `src/lib/patterns/factory/TaskFactory.ts`
- `src/lib/patterns/decorator/ResponseDecorator.ts`

**目的**: オブジェクトの生成ロジックをカプセル化

**実装詳細**:
- `TaskFactory` 抽象クラスでタスク生成インターフェースを定義
- `StandardTaskFactory`, `AppendTaskFactory`, `PriorityTaskFactory` で異なる生成戦略を実装
- `ResponseFactory` でAPIレスポンスの生成を統一

**利点**:
- オブジェクト生成の柔軟性
- クライアントコードから生成ロジックを分離
- 新しいタイプの追加が容易

```typescript
// 使用例
const factory = TaskFactoryProvider.getStandardFactory();
const taskData = factory.createTaskData({ title: "新しいタスク" });
```

---

### 4. Builder Pattern（ビルダーパターン）

**分類**: 生成パターン（Creational Pattern）

**場所**:
- `src/lib/patterns/builder/TaskBuilder.ts`
- `src/lib/patterns/chain/ValidationChain.ts`（ValidationChainBuilder）

**目的**: 複雑なオブジェクトの構築プロセスを段階的に行う

**実装詳細**:
- `TaskDataBuilder` でタスクデータを段階的に構築
- `FluentTaskBuilder` で読みやすいFluent Interfaceを提供
- `TaskBuilderDirector` で定型的な構築パターンを提供
- `ValidationChainBuilder` でバリデーションチェーンを構築

**利点**:
- 複雑な構築ロジックの分離
- オブジェクトの不変性を保持
- 可読性の高いコード

```typescript
// 使用例
const task = new FluentTaskBuilder()
  .withTitle("重要なタスク")
  .withDescription("詳細な説明")
  .atPosition(0)
  .build();
```

---

### 5. Strategy Pattern（ストラテジーパターン）

**分類**: 振る舞いパターン（Behavioral Pattern）

**場所**: `src/lib/patterns/strategy/ValidationStrategy.ts`

**目的**: アルゴリズムのファミリーを定義し、交換可能にする

**実装詳細**:
- `IValidationStrategy` インターフェースでバリデーション戦略を定義
- 各種バリデーション戦略クラス（Required, Type, MaxLength, etc.）
- `CompositeValidationStrategy` で複数戦略を組み合わせ

**利点**:
- アルゴリズムの動的な切り替え
- 新しいバリデーションルールの追加が容易
- 条件分岐の削減

```typescript
// 使用例
const strategy = new CompositeValidationStrategy()
  .addStrategy(new RequiredValidationStrategy("タイトル"))
  .addStrategy(new MaxLengthValidationStrategy(100, "タイトル"));

const result = strategy.validate(title);
```

---

### 6. Chain of Responsibility Pattern（責任の連鎖パターン）

**分類**: 振る舞いパターン（Behavioral Pattern）

**場所**: `src/lib/patterns/chain/ValidationChain.ts`

**目的**: 複数のハンドラーに処理を順次渡す

**実装詳細**:
- `AbstractValidationHandler` 基底クラス
- 各種バリデーションハンドラー（Required, Type, MaxLength, etc.）
- `ValidationChainBuilder` でチェーンを構築

**利点**:
- 処理の動的な組み合わせ
- 送信者と受信者の疎結合
- 柔軟な処理フロー

```typescript
// 使用例
const chain = new ValidationChainBuilder()
  .addRequired()
  .addType("string")
  .addMaxLength(100)
  .build();

const result = chain.handle(value, { fieldName: "タイトル" });
```

---

### 7. Command Pattern（コマンドパターン）

**分類**: 振る舞いパターン（Behavioral Pattern）

**場所**: `src/lib/patterns/command/TaskCommands.ts`

**目的**: リクエストをオブジェクトとしてカプセル化

**実装詳細**:
- `ICommand` インターフェースでコマンドを定義
- 各種タスクコマンド（GetAll, GetById, Create, Update, Delete, Toggle, Reorder）
- `CommandInvoker` でコマンド実行と履歴管理

**利点**:
- 操作の履歴管理
- アンドゥ/リドゥ機能の実装が容易
- リクエストのキューイング
- トランザクション管理

```typescript
// 使用例
const command = new CreateTaskCommand(repository, "新しいタスク", null);
const result = await invoker.execute(command);
```

---

### 8. Decorator Pattern（デコレーターパターン）

**分類**: 構造パターン（Structural Pattern）

**場所**: `src/lib/patterns/decorator/ResponseDecorator.ts`

**目的**: オブジェクトに動的に新しい責任を追加

**実装詳細**:
- `ApiResponse` インターフェース
- `BaseResponse` 基本レスポンスクラス
- 各種デコレーター（Timestamp, Metadata, Cache）
- `ResponseBuilder` で宣言的にレスポンスを構築

**利点**:
- 機能の動的な追加
- サブクラス化の代替手段
- 柔軟な機能拡張

```typescript
// 使用例（将来的な拡張）
const response = new ResponseBuilder()
  .success(data)
  .withTimestamp()
  .withMetadata({ version: "1.0" })
  .build();
```

---

## アーキテクチャ概要

```
┌─────────────────────────────────────────────────┐
│              API Route Handlers                  │
│  (/api/tasks, /api/tasks/[id], etc.)            │
└──────────────────┬──────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────┐
│           Command Pattern Layer                  │
│  (CreateTaskCommand, UpdateTaskCommand, etc.)   │
└──────────────────┬──────────────────────────────┘
                   │
       ┌───────────┴───────────┐
       ↓                       ↓
┌──────────────┐      ┌────────────────┐
│  Validation  │      │   Repository   │
│    Layer     │      │     Layer      │
│  (Strategy,  │      │  (TaskRepo)    │
│   Chain)     │      └────────┬───────┘
└──────────────┘               │
                               ↓
                      ┌─────────────────┐
                      │  Database       │
                      │  (Prisma)       │
                      └─────────────────┘
```

## 各層の責任

### 1. API Route Handlers
- HTTPリクエストの受け取り
- コマンドの生成と実行
- レスポンスの返却

### 2. Command Layer
- ビジネスロジックのカプセル化
- トランザクション管理
- エラーハンドリング

### 3. Validation Layer
- 入力データの検証
- ビジネスルールの適用

### 4. Repository Layer
- データアクセスの抽象化
- クエリの実行

### 5. Database Layer
- データの永続化
- スキーマ管理

## 利点のまとめ

### 保守性の向上
- 各パターンが責任を明確に分離
- コードの可読性が向上
- 変更の影響範囲が限定的

### テスタビリティの向上
- 依存性の注入が容易
- モックオブジェクトの作成が簡単
- 単体テストの作成が容易

### 拡張性の向上
- 新機能の追加が容易
- 既存コードの変更を最小限に
- Open/Closed原則の遵守

### 再利用性の向上
- パターンの再利用
- コンポーネントの独立性
- 他プロジェクトへの適用が容易

## 今後の拡張可能性

### Observer Pattern
タスクの状態変更を通知するシステム

```typescript
interface TaskObserver {
  onTaskCreated(task: Task): void;
  onTaskUpdated(task: Task): void;
  onTaskDeleted(taskId: number): void;
}
```

### State Pattern
タスクのライフサイクル管理

```typescript
interface TaskState {
  handle(task: Task): void;
}

class PendingState implements TaskState { ... }
class CompletedState implements TaskState { ... }
class ArchivedState implements TaskState { ... }
```

### Proxy Pattern
キャッシュやアクセス制御

```typescript
class CachedTaskRepository implements ITaskRepository {
  constructor(private realRepository: ITaskRepository) {}
  // キャッシュロジックを追加
}
```

### Adapter Pattern
外部APIとの統合

```typescript
interface ExternalTaskService {
  fetchTasks(): Promise<ExternalTask[]>;
}

class TaskServiceAdapter implements ITaskRepository {
  constructor(private externalService: ExternalTaskService) {}
  // アダプター実装
}
```

## 結論

このタスク管理アプリケーションでは、8つのGoFデザインパターンを適用することで：

1. **コードの品質向上**: 明確な責任分離と高い凝集度
2. **保守性の向上**: 変更の容易さと影響範囲の限定
3. **テスト容易性**: 依存性の注入とモック化
4. **拡張性**: 新機能追加の柔軟性

これらの利点を実現しました。デザインパターンは銀の弾丸ではありませんが、適切に使用することで、保守性と拡張性の高いソフトウェアを構築できます。
