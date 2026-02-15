import { type NextRequest } from "next/server"
import {
  DELETE as baseDELETE,
  GET as baseGET,
  PUT as basePUT,
} from "@/app/api/videos/[id]/route"

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, props: RouteParams) {
  return baseGET(request, props)
}

export async function PUT(request: NextRequest, props: RouteParams) {
  return basePUT(request, props)
}

export async function DELETE(request: NextRequest, props: RouteParams) {
  return baseDELETE(request, props)
}
