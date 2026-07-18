import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface ProfileRow {
  resume_name: string | null;
  resume_url: string | null;
  resume_text: string | null;
  resume_text_updated_at: string | null;
}

interface DocumentRow {
  type: string;
  name: string;
  file_url: string;
  file_size: number;
  created_at: string;
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  resume: 'Resume',
  cover_letter: 'Cover Letter',
  transcript: 'Transcript',
  certification: 'Certification',
  portfolio: 'Portfolio',
  other: 'Other',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return textResponse('Missing Authorization header', 401);
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return textResponse('Not authenticated', 401);
    }

    const [{ data: profile }, { data: documents }] = await Promise.all([
      supabaseClient
        .from('profiles')
        .select('resume_name, resume_url, resume_text, resume_text_updated_at')
        .eq('id', user.id)
        .maybeSingle(),
      supabaseClient
        .from('documents')
        .select('type, name, file_url, file_size, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
    ]);

    const markdown = buildProfileMarkdown(user, profile, documents ?? []);

    return new Response(markdown, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': 'inline; filename="profile.md"',
      },
    });
  } catch (error) {
    console.error('profile-markdown error:', error);
    return textResponse('Unexpected error generating profile.md', 500);
  }
});

function buildProfileMarkdown(
  user: { email?: string; user_metadata?: Record<string, unknown> },
  profile: ProfileRow | null,
  documents: DocumentRow[],
): string {
  const firstName = typeof user.user_metadata?.first_name === 'string' ? user.user_metadata.first_name : '';
  const lastName = typeof user.user_metadata?.last_name === 'string' ? user.user_metadata.last_name : '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ');

  const lines: string[] = [];
  lines.push(`# Profile: ${fullName || user.email || 'Unnamed'}`);
  lines.push('');
  lines.push(`_Generated: ${new Date().toISOString()}_`);
  lines.push('');

  lines.push('## Contact');
  if (fullName) lines.push(`- Name: ${fullName}`);
  if (user.email) lines.push(`- Email: ${user.email}`);
  lines.push('');

  lines.push('## Resume');
  if (profile?.resume_url) {
    lines.push(`- File: [${profile.resume_name ?? 'resume'}](${profile.resume_url})`);
  } else {
    lines.push('_No resume uploaded yet._');
  }
  if (profile?.resume_text) {
    lines.push('');
    lines.push('### Resume Text');
    lines.push('');
    lines.push('```');
    lines.push(profile.resume_text);
    lines.push('```');
  }
  lines.push('');

  lines.push('## Documents');
  if (documents.length === 0) {
    lines.push('_No additional documents uploaded._');
  } else {
    for (const doc of documents) {
      const label = DOCUMENT_TYPE_LABELS[doc.type] ?? doc.type;
      const sizeKb = Math.round(doc.file_size / 1024);
      const date = new Date(doc.created_at).toISOString().slice(0, 10);
      lines.push(`- **${label}**: [${doc.name}](${doc.file_url}) (${sizeKb} KB, ${date})`);
    }
  }
  lines.push('');

  return lines.join('\n');
}

function textResponse(message: string, status: number): Response {
  return new Response(message, {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
