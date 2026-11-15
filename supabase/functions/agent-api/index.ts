import { restFromEnv } from '../_shared/agent/rest.ts'
import { handle } from './handler.ts'

const rest = restFromEnv()

Deno.serve(req => handle(req, rest))
