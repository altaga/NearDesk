import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const getTarget = () =>
  (
    process.env.DESK_API_URL ||
    process.env.NEXT_PUBLIC_DESK_API_URL ||
    "http://127.0.0.1:8000"
  ).replace(/\/$/, "");

async function handle(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const target = getTarget();
  const subPath = (params.path || []).join("/");
  const url = `${target}/v1/${subPath}${req.nextUrl.search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    const k = key.toLowerCase();
    if (k !== "host" && k !== "connection" && k !== "content-length") {
      headers.set(key, value);
    }
  });

  try {
    const body =
      req.method !== "GET" && req.method !== "HEAD"
        ? await req.arrayBuffer()
        : undefined;

    const res = await fetch(url, {
      method: req.method,
      headers,
      body,
      cache: "no-store",
    });

    const resHeaders = new Headers();
    res.headers.forEach((v, k) => {
      const lk = k.toLowerCase();
      if (lk !== "content-encoding" && lk !== "transfer-encoding") {
        resHeaders.set(k, v);
      }
    });

    const data = await res.arrayBuffer();
    return new NextResponse(data, {
      status: res.status,
      headers: resHeaders,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "BOARD_OFFLINE",
          message:
            err instanceof Error ? err.message : "Board gateway unreachable",
        },
      },
      { status: 502 }
    );
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const DELETE = handle;
export const PATCH = handle;
