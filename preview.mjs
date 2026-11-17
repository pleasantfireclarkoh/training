import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'

const root = new URL('./docs/', import.meta.url)
const types = new Map([
  ['html', 'text/html;charset=utf-8'],
  ['css', 'text/css;charset=utf-8'],
  ['js', 'text/javascript;charset=utf-8'],
  ['png', 'image/png'],
])

createServer(async (request, response) => {
  const { pathname } = new URL(request.url, 'http://localhost')
  const file = pathname === '/' ? 'index.html' : pathname.slice(1)
  const type = types.get(file.split('.').at(-1))
  if (!type || !/^(?:img\/)?[a-z0-9.-]+$/.test(file) || file.startsWith('.')) {
    response.writeHead(404).end()
    return
  }
  try {
    const bytes = await readFile(new URL(file, root))
    response.writeHead(200, { 'Content-Type': type, 'Referrer-Policy': 'no-referrer' }).end(bytes)
  } catch {
    response.writeHead(404).end()
  }
}).listen(4173, '127.0.0.1', () => process.stdout.write('PTFD CE demo: http://127.0.0.1:4173/\n'))
