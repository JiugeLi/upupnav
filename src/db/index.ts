import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

// 检查是否在本地开发环境
const isLocalDev = typeof process.env.WRANGLER === 'undefined' && typeof window === 'undefined';

/**
 * 创建数据库实例
 * 在 Cloudflare Workers 环境中使用 D1Database
 * 在本地开发环境且配置了 D1_DATABASE_ID 时，使用 HTTP 代理
 */
export const createDb = (d1: D1Database | null = null) => {
  // 如果提供了 D1Database，直接使用（Cloudflare Workers 环境）
  if (d1) {
    return drizzle(d1, { schema });
  }

  // 本地开发模式，检查是否使用远程 D1
  if (isLocalDev && process.env.D1_DATABASE_ID && process.env.CLOUDFLARE_ACCOUNT_ID) {
    console.log('[DB] Using remote D1 via HTTP proxy');
    // 返回特殊的代理对象
    return createHttpProxyDb();
  }

  // 返回空数据库（用于静态生成等）
  return null as any;
};

// HTTP 代理数据库实现（仅用于本地开发）
function createHttpProxyDb() {
  const databaseId = process.env.D1_DATABASE_ID;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!databaseId || !accountId || !apiToken) {
    throw new Error('Missing D1 configuration for remote access');
  }

  async function executeQuery(sql: string, params: unknown[] = []): Promise<any> {
    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiToken}`,
          },
          body: JSON.stringify({ sql, params: params.map(p => String(p)) }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('[D1 HTTP] Error:', error);
        throw new Error(`D1 API error: ${response.status}`);
      }

      const result = await response.json() as any;
      return result.result;
    } catch (error) {
      console.error('[D1 HTTP] Query error:', error);
      throw error;
    }
  }

  // Drizzle ORM D1 适配器需要的接口
  return {
    _namespace: 'drizzle-orm/d1',

    // execute 用于运行 DML/DDL 语句
    execute(sql: string, params: unknown[] = []): Promise<{ lastRowId: bigint; rowsAffected: number }> {
      return executeQuery(sql, params).then((result: any) => {
        return {
          lastRowId: BigInt(result.meta.last_row_id || 0),
          rowsAffected: result.meta.rows_affected || 0,
        };
      });
    },

    // all 用于运行查询语句并返回所有结果
    all<T = any>(sql: string, params: unknown[] = []): Promise<T[]> {
      return executeQuery(sql, params).then((result: any) => {
        if (!result.results || result.results.length === 0) {
          return [];
        }
        // D1 HTTP API 返回格式: [columns, ...rows]
        const columns = result.results[0] as string[];
        const rows: T[] = [];
        for (let i = 1; i < result.results.length; i++) {
          const row: Record<string, unknown> = {};
          result.results[i].forEach((value: unknown, idx: number) => {
            row[columns[idx]] = value;
          });
          rows.push(row as T);
        }
        return rows;
      });
    },

    // run 用于运行任何语句（兼容illary 命令）
    run<T = any>(sql: string, params: unknown[] = []): Promise<T> {
      return executeQuery(sql, params) as Promise<T>;
    },

    // get 用于返回单行结果
    get<T = any>(sql: string, params: unknown[] = []): Promise<T | undefined> {
      return executeQuery(sql, params).then((result: any) => {
        if (!result.results || result.results.length < 2) {
          return undefined;
        }
        const columns = result.results[0] as string[];
        const row: Record<string, unknown> = {};
        result.results[1].forEach((value: unknown, idx: number) => {
          row[columns[idx]] = value;
        });
        return row as T;
      });
    },

    // 预处理语句
    prepare(sql: string) {
      return {
        bind: (...params: unknown[]) => ({
          run: () => executeQuery(sql, params),
          all: () => executeQuery(sql, params),
          get: () => executeQuery(sql, params),
        }),
      };
    },

    // 用于 Drizzle 的内部调用
    executeStatement(sql: string, params: unknown[] = []) {
      return executeQuery(sql, params);
    },

    // schema 引用
    schema,
  };
}
