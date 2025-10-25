// Minimal Auth0 Management API bridge for Admin dashboard
// Returns a list of users (name, email, user_id, created_at, last_login, logins_count, picture, email_verified)

import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const domain = process.env.AUTH0_DOMAIN?.trim();
  const clientId = process.env.AUTH0_MGMT_CLIENT_ID?.trim();
  const clientSecret = process.env.AUTH0_MGMT_CLIENT_SECRET?.trim();
  const audience = process.env.AUTH0_MGMT_AUDIENCE?.trim() || (domain ? `https://${domain}/api/v2/` : undefined);

  // Debug: log what we got
  console.log('Auth0 env vars:', { 
    domain: domain ? 'SET' : 'MISSING', 
    clientId: clientId ? 'SET' : 'MISSING', 
    clientSecret: clientSecret ? 'SET' : 'MISSING',
    audience: audience ? 'SET' : 'MISSING'
  });

  if (!domain || !clientId || !clientSecret || !audience) {
    return res.status(500).json({ 
      error: 'Auth0 Management API env vars missing',
      debug: { 
        domain: domain || 'MISSING', 
        clientId: clientId ? 'SET' : 'MISSING', 
        clientSecret: clientSecret ? 'SET' : 'MISSING', 
        audience: audience || 'MISSING',
        allEnvVars: Object.keys(process.env).filter(k => k.startsWith('AUTH0'))
      }
    });
  }

  try {
    // Debug: log the request details
    console.log('Auth0 token request:', {
      domain,
      clientId: clientId ? 'SET' : 'MISSING',
      clientSecret: clientSecret ? 'SET' : 'MISSING',
      audience
    });

    // Fetch management API token
    const tokenRes = await fetch(`https://${domain}/oauth/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        audience,
      }),
    });
    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      console.log('Auth0 token error:', text);
      return res.status(500).json({ 
        error: 'Failed to get Auth0 token', 
        details: text,
        debug: {
          domain,
          clientId: clientId ? 'SET' : 'MISSING',
          audience
        }
      });
    }
    const { access_token } = await tokenRes.json();

    // Fetch first page (up to 100) of users, ordered by last_login desc
    const usersRes = await fetch(`https://${domain}/api/v2/users?per_page=100&sort=last_login:-1`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!usersRes.ok) {
      const text = await usersRes.text();
      return res.status(500).json({ error: 'Failed to fetch users', details: text });
    }
    const users = await usersRes.json();

    // Map to a compact payload
    const data = (Array.isArray(users) ? users : []).map((u: any) => ({
      user_id: u.user_id,
      name: u.name,
      email: u.email,
      picture: u.picture,
      email_verified: u.email_verified,
      created_at: u.created_at,
      last_login: u.last_login,
      logins_count: u.logins_count,
    }));

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ users: data });
  } catch (err: any) {
    return res.status(500).json({ error: 'Unexpected error', details: String(err?.message || err) });
  }
}


