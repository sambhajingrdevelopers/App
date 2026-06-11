"use client"

import { useState } from "react"

export default function EditProfilePage() {
  const [name, setName] = useState("Digital Creator")
  const [bio, setBio] = useState("Real connected VibeLoop creator")

  function save() {
    try {
      localStorage.setItem("profile_name", name)
      localStorage.setItem("profile_bio", bio)
    } catch {}
    alert("Profile updated")
    window.location.href = "/profile"
  }

  return (
    <main className="safePage">
      <h1>Edit Profile</h1>
      <p>Update creator profile details</p>

      <div className="safeCard">
        <label>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} />

        <label>Bio</label>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} />

        <button onClick={save}>Save Profile</button>
      </div>

      <a className="safeBack" href="/profile">Back to Profile</a>
    </main>
  )
}
