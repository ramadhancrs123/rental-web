import test from "node:test"
import assert from "node:assert/strict"
import manifest from "../../app/manifest.ts"

test("Akasha Smart Booking exposes a standalone installable web app manifest", () => {
  const value = manifest()

  assert.equal(value.name, "Akasha Smart Booking — Akasha Outdoor")
  assert.equal(value.short_name, "Akasha")
  assert.equal(value.start_url, "/")
  assert.equal(value.scope, "/")
  assert.equal(value.display, "standalone")
  assert.equal(value.background_color, "#f8fafc")
  assert.equal(value.theme_color, "#e87516")
  assert.equal(value.prefer_related_applications, false)
})

test("PWA manifest starts at the public homepage and stays scoped to the entire website", () => {
  const value = manifest()
  assert.equal(value.start_url, "/")
  assert.equal(value.scope, "/")
  assert.equal(value.display, "standalone")
})

test("PWA manifest includes standard and maskable launcher icons", () => {
  const value = manifest()
  const icons = value.icons ?? []

  assert.ok(icons.some((icon) => icon.sizes === "192x192" && icon.purpose === "any"))
  assert.ok(icons.some((icon) => icon.sizes === "512x512" && icon.purpose === "any"))
  assert.ok(icons.some((icon) => icon.sizes === "512x512" && icon.purpose === "maskable"))
})
