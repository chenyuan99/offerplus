import { createClient } from 'jsr:@supabase/supabase-js@2';
import { extractText, getDocumentProxy } from 'npm:unpdf@0.12.1';
import mammoth from 'npm:mammoth@1.8.0';
import { Buffer } from 'node:buffer';
import { corsHeaders } from '../_shared/cors.ts';

const MAX_TEXT_LENGTH = 20000;
const MAX_FILE_BYTES = 5 * 1024 * 1024; // matches the frontend's upload size limit

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ success: false, error: 'Missing Authorization header' }, 401);
    }

    const { filePath } = await req.json();
    if (!filePath || typeof filePath !== 'string') {
      return jsonResponse({ success: false, error: 'filePath is required' }, 400);
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return jsonResponse({ success: false, error: 'Not authenticated' }, 401);
    }

    const fileResponse = await fetch(filePath);
    if (!fileResponse.ok) {
      return jsonResponse(
        { success: false, error: `Could not download resume (HTTP ${fileResponse.status})` },
        400,
      );
    }

    const declaredLength = Number(fileResponse.headers.get('content-length') ?? '0');
    if (declaredLength > MAX_FILE_BYTES) {
      return jsonResponse({ success: false, error: 'Resume file is too large to process' }, 400);
    }

    const bytes = new Uint8Array(await fileResponse.arrayBuffer());
    if (bytes.byteLength > MAX_FILE_BYTES) {
      return jsonResponse({ success: false, error: 'Resume file is too large to process' }, 400);
    }

    const extension = filePath.split('.').pop()?.toLowerCase().split(/[?#]/)[0] ?? '';

    let resumeText: string;
    try {
      resumeText = await extractResumeText(bytes, extension);
    } catch (extractError) {
      console.error('Resume text extraction failed:', extractError);
      return jsonResponse(
        {
          success: false,
          error: extractError instanceof Error ? extractError.message : 'Failed to extract resume text',
        },
        422,
      );
    }

    if (!resumeText.trim()) {
      return jsonResponse(
        { success: false, error: 'No extractable text found in this resume' },
        422,
      );
    }

    const truncated = resumeText.length > MAX_TEXT_LENGTH;
    const text = truncated ? resumeText.slice(0, MAX_TEXT_LENGTH) : resumeText;

    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({ resume_text: text, resume_text_updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to persist resume text:', updateError);
      return jsonResponse({ success: false, error: 'Failed to save extracted resume text' }, 500);
    }

    return jsonResponse({ success: true, text, textLength: text.length, truncated });
  } catch (error) {
    console.error('process-resume error:', error);
    return jsonResponse(
      { success: false, error: error instanceof Error ? error.message : 'Unexpected error' },
      500,
    );
  }
});

async function extractResumeText(bytes: Uint8Array, extension: string): Promise<string> {
  if (extension === 'pdf') {
    const pdf = await getDocumentProxy(bytes);
    const { text } = await extractText(pdf, { mergePages: true });
    return normalizeWhitespace(text);
  }

  if (extension === 'docx') {
    const { value } = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
    return normalizeWhitespace(value);
  }

  if (extension === 'doc') {
    throw new Error('Legacy .doc files are not supported yet — please upload a PDF or DOCX resume.');
  }

  throw new Error(`Unsupported resume file type: .${extension || 'unknown'}`);
}

function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
