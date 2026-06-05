import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SharedHospital {
  name: string;
  address: string;
  city: string;
  lga: string;
  phone: string;
  email: string;
  specialties: string[];
  rating: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const from = Deno.env.get('RESEND_FROM_EMAIL') || 'Carefinder <onboarding@resend.dev>';
    if (!resendApiKey) throw new Error('RESEND_API_KEY is not configured.');

    const { recipientEmail, hospitals, shareUrl } = await req.json() as {
      recipientEmail: string;
      hospitals: SharedHospital[];
      shareUrl: string;
    };

    if (!recipientEmail || !Array.isArray(hospitals) || hospitals.length === 0) {
      return new Response(JSON.stringify({ error: 'recipientEmail and hospitals are required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const hospitalItems = hospitals.map((hospital) => `
      <li style="margin-bottom:16px">
        <strong>${hospital.name}</strong><br/>
        ${hospital.address}, ${hospital.city} (${hospital.lga} LGA)<br/>
        Phone: ${hospital.phone}<br/>
        Email: ${hospital.email || 'Not listed'}<br/>
        Specialties: ${hospital.specialties.join(', ')}<br/>
        Rating: ${hospital.rating.toFixed(1)}
      </li>
    `).join('');

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: recipientEmail,
        subject: 'Carefinder hospital list',
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.5;color:#16201c">
            <h1>Carefinder Hospital List</h1>
            <p>A curated hospital list was shared with you.</p>
            <ul>${hospitalItems}</ul>
            <p><a href="${shareUrl}">Open the live search</a></p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
