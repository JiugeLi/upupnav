# API 更新清单

## 需要更新的 API 文件

所有 API 都需要添加用户认证和数据过滤。

### 核心变更模式

```typescript
// 1. 导入辅助函数
import { getCurrentUserId } from '@/lib/get-current-user';
import { and } from 'drizzle-orm';

// 2. 在每个 API 函数开始处获取用户 ID
const userId = getCurrentUserId(req);
if (!userId) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// 3. 查询时过滤用户数据
.where(eq(table.user_id, userId))

// 4. 插入时添加 user_id
.values({ user_id: userId, ...otherData })

// 5. 更新/删除时验证所有权
.where(and(
  eq(table.id, id),
  eq(table.user_id, userId)
))
```

## 已更新 ✅
- [x] src/app/api/groups/route.ts
- [x] src/app/api/groups/[id]/route.ts

## 待更新 ⏳
- [ ] src/app/api/websites/route.ts
- [ ] src/app/api/websites/[id]/route.ts
- [ ] src/app/api/websites/[id]/click/route.ts
- [ ] src/app/api/groups/import/route.ts

## 不需要更新（无用户数据）
- src/app/api/health/route.ts
- src/app/api/test-db/route.ts
- src/app/api/test-env/route.ts
- src/app/api/auth/* (认证相关)
- src/app/api/websites/analyze/route.ts (工具类)
- src/app/api/websites/fetch-logo/route.ts (工具类)
