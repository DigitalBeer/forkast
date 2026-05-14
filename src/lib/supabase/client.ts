import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          if (typeof window === 'undefined') return []
          return document.cookie.split(';').reduce((acc, cookie) => {
            const trimmed = cookie.trim()
            if (!trimmed) return acc

            const eqIndex = trimmed.indexOf('=')
            if (eqIndex <= 0) return acc

            const name = trimmed.slice(0, eqIndex).trim()
            const rawValue = trimmed.slice(eqIndex + 1)
            const value = rawValue ?? ''

            if (name) {
              acc.push({ name, value })
            }
            return acc
          }, [] as Array<{ name: string; value: string }>)
        },
        setAll(cookies) {
          if (typeof window === 'undefined') return
          cookies.forEach(({ name, value, options }) => {
            let cookieString = `${name}=${value}`
            if (options?.maxAge) {
              cookieString += `; max-age=${options.maxAge}`
            }
            if (options?.domain) {
              cookieString += `; domain=${options.domain}`
            }
            if (options?.path) {
              cookieString += `; path=${options.path}`
            }
            if (options?.sameSite) {
              cookieString += `; samesite=${options.sameSite}`
            }
            if (options?.secure) {
              cookieString += `; secure`
            }
            if (options?.httpOnly) {
              cookieString += `; httponly`
            }
            document.cookie = cookieString
          })
        },
      },
    }
  )
}
