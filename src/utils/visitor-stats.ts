// 访问统计服务端共享工具：D1 访问与边缘地理信息（仅 Cloudflare Worker 运行时可用）
// 使用方：src/pages/api/visit.ts、src/pages/api/visit/geo.ts

/** D1 最小结构类型，避免为类型检查引入 @cloudflare/workers-types 依赖 */
export interface D1Meta {
	changes?: number;
}
export interface D1Statement {
	bind(...values: (string | number | null)[]): D1Statement;
	run(): Promise<{ meta?: D1Meta }>;
	first<T>(column: string): Promise<T | null>;
	all<T>(): Promise<{ results?: T[] }>;
}
export interface D1Database {
	prepare(query: string): D1Statement;
	batch(statements: D1Statement[]): Promise<{ meta?: D1Meta }[]>;
}

/** Cloudflare 边缘自带的请求地理信息 */
export interface CfGeo {
	country?: string; // ISO 3166 国家码，如 "CN"
	region?: string; // 省/州，如 "Zhejiang"
	city?: string; // 城市，如 "Hangzhou"
	latitude?: string; // 纬度，如 "30.29400"（访客地图用）
	longitude?: string; // 经度，如 "120.16190"
}

interface RuntimeEnv {
	cf?: CfGeo;
}

/**
 * 取 D1 binding。Astro v6+ 移除了 locals.runtime.env，
 * 需从 "cloudflare:workers" 模块取 env；该模块只在 Cloudflare 运行时存在，
 * 非 CF 环境（本地无 adapter dev、其他平台部署）导入失败时返回 undefined。
 * 动态 specifier + @vite-ignore 避免 Vite 在非 CF 构建下静态解析报错。
 */
export async function getDb(): Promise<D1Database | undefined> {
	try {
		const moduleSpecifier = "cloudflare:workers";
		const { env } = (await import(/* @vite-ignore */ moduleSpecifier)) as {
			env: { DB?: D1Database };
		};
		return env.DB;
	} catch {
		return undefined;
	}
}

export function getGeo(request: Request, locals: unknown): CfGeo {
	// request.cf 是 workerd 原生属性，adapter 转发时通常保留；
	// 再兜底 locals.runtime.cf 与 cf-ipcountry 头，读取全程 try/catch 防御各版本 adapter 差异
	let cf: CfGeo | undefined;
	try {
		cf = (request as Request & { cf?: CfGeo }).cf;
	} catch {
		/* ignore */
	}
	if (!cf) {
		try {
			cf = (locals as RuntimeEnv | undefined)?.cf;
		} catch {
			/* ignore */
		}
	}
	return {
		country: cf?.country ?? request.headers.get("cf-ipcountry") ?? undefined,
		region: cf?.region,
		city: cf?.city,
		latitude: cf?.latitude,
		longitude: cf?.longitude,
	};
}

export function jsonResponse(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			"content-type": "application/json; charset=utf-8",
			"cache-control": "no-store",
		},
	});
}
