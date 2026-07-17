export async function GET() {
  return Response.json({ error: 'Not Found' }, { status: 404 })
}
