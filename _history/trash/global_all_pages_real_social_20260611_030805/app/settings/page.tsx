'use client'

import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import AuthGuard from '../../components/AuthGuard'
import SocialAppShell from '../../components/SocialAppShell'
import { getSessionUser } from '../../lib/sessionUser'

function cleanUsername(value?: string) {
  const clean = String(value || '').trim()
  if (!clean) return '@you'
  return clean.startsWith('@') ? clean : `@${clean}`
}

function validMedia(url?: string) {
  const clean = String(url || '').trim()
  return clean.startsWith('http') || clean.startsWith('/media/') || clean.startsWith('data:')
}

export default function SettingsPage() {
  const [username, setUsername] = useState('@you')
  const [name, setName] = useState('Creator')
  const [email, setEmail] = useState('')
  const [bio, setBio] = useState('Digital Creator')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [bannerUrl, setBannerUrl] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [allowMessages, setAllowMessages] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState('')
  const [notice, setNotice] = useState('')

  async function loadSettings() {
    setLoading(true)
    setNotice('')

    try {
      const session = await getSessionUser()
      const userName = cleanUsername(session.username)
      setUsername(userName)

      const data = await fetch(`/api/settings/profile?username=${encodeURIComponent(userName)}`, {
        cache: 'no-store'
      }).then((res) => res.json())

      if (!data.success) {
        throw new Error(data.message || 'Settings load failed.')
      }

      const user = data.user || {}

      setName(user.name || session.name || 'Creator')
      setEmail(user.email || '')
      setBio(user.bio || 'Digital Creator')
      setAvatarUrl(user.avatarUrl || '')
      setBannerUrl(user.bannerUrl || '')
      setIsPrivate(Boolean(user.isPrivate))
      setAllowMessages(user.allowMessages !== false)
    } catch (error: any) {
      setNotice(error?.message || 'Settings load failed.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  async function uploadMedia(event: ChangeEvent<HTMLInputElement>, field: 'avatar' | 'banner') {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(field)
    setNotice('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/content/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Upload failed.')
      }

      const url = data.mediaUrl || data.videoUrl || ''

      if (field === 'avatar') {
        setAvatarUrl(url)
      } else {
        setBannerUrl(url)
      }

      setNotice(`${field === 'avatar' ? 'Profile photo' : 'Cover banner'} uploaded.`)
    } catch (error: any) {
      setNotice(error?.message || 'Upload failed.')
    } finally {
      setUploading('')
    }
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setSaving(true)
    setNotice('')

    try {
      const response = await fetch('/api/settings/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          name,
          email,
          bio,
          avatarUrl,
          bannerUrl,
          isPrivate,
          allowMessages
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Settings save failed.')
      }

      setNotice('Profile settings saved successfully.')
    } catch (error: any) {
      setNotice(error?.message || 'Settings save failed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AuthGuard>
      <SocialAppShell active="profile" title="" subtitle="" hideSearch>
        <main className="vlxSettingsPage">
          <header className="vlxSettingsHeader">
            <a href="/profile">‹</a>

            <div>
              <h1>Settings</h1>
              <p>Manage profile, privacy and message permissions.</p>
            </div>

            <a href="/profile">View</a>
          </header>

          {loading ? (
            <section className="vlxSettingsState">Loading settings...</section>
          ) : (
            <form className="vlxSettingsForm" onSubmit={saveSettings}>
              <section className="vlxSettingsPreview">
                <div className="vlxSettingsBanner">
                  {validMedia(bannerUrl) ? <img src={bannerUrl} alt="Cover banner" /> : <span />}
                </div>

                <div className="vlxSettingsIdentity">
                  <div className="vlxSettingsAvatar">
                    {validMedia(avatarUrl) ? <img src={avatarUrl} alt={name} /> : <b>{name.slice(0, 1).toUpperCase()}</b>}
                  </div>

                  <div>
                    <h2>{name}</h2>
                    <p>{username}</p>
                    <small>{bio}</small>
                  </div>
                </div>
              </section>

              <section className="vlxUploadSettings">
                <label>
                  Upload Profile Photo
                  <input type="file" accept="image/*" onChange={(event) => uploadMedia(event, 'avatar')} />
                  {uploading === 'avatar' && <small>Uploading profile photo...</small>}
                </label>

                <label>
                  Upload Cover Banner
                  <input type="file" accept="image/*" onChange={(event) => uploadMedia(event, 'banner')} />
                  {uploading === 'banner' && <small>Uploading cover banner...</small>}
                </label>
              </section>

              <section className="vlxSettingsFields">
                <label>
                  Display Name
                  <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Display name" />
                </label>

                <label>
                  Username
                  <input value={username} disabled placeholder="@username" />
                </label>

                <label>
                  Email
                  <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" />
                </label>

                <label>
                  Bio
                  <textarea value={bio} onChange={(event) => setBio(event.target.value)} rows={4} placeholder="Bio" />
                </label>

                <label>
                  Avatar URL
                  <input value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} placeholder="Profile photo URL" />
                </label>

                <label>
                  Banner URL
                  <input value={bannerUrl} onChange={(event) => setBannerUrl(event.target.value)} placeholder="Cover banner URL" />
                </label>
              </section>

              <section className="vlxPrivacyPanel">
                <label>
                  <span>
                    <b>Private Profile</b>
                    <small>Only owner can see posts/reels if private is enabled.</small>
                  </span>
                  <input type="checkbox" checked={isPrivate} onChange={(event) => setIsPrivate(event.target.checked)} />
                </label>

                <label>
                  <span>
                    <b>Allow Messages</b>
                    <small>Public users can message you when enabled.</small>
                  </span>
                  <input type="checkbox" checked={allowMessages} onChange={(event) => setAllowMessages(event.target.checked)} />
                </label>
              </section>

              {notice && <section className="vlxSettingsNotice">{notice}</section>}

              <button className="vlxSettingsSave" type="submit" disabled={saving || Boolean(uploading)}>
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </form>
          )}
        </main>
      </SocialAppShell>
    </AuthGuard>
  )
}
