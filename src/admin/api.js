// GET when body is undefined, otherwise POST as JSON. Throws with the server's message on failure.
export async function api(path, body) {
  const res = await fetch(`/api${path}`, body === undefined ? {} : {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    // Session expired or logged out elsewhere: the shell goes back to the login form.
    if (res.status === 401 && path !== '/login') dispatchEvent(new Event('admin:unauthorized'))
    throw new Error(data.error || `Server javob bermadi (${res.status})`)
  }
  return data
}
