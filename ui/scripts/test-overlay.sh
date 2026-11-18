#!/bin/sh
# Packs @reqquest/ui and builds test-fixture/ against the tarball exactly as a downstream project
# would: @reqquest/ui is its only dependency, there is no svelte/vite config, and the routes come from
# the package's app shell plus the fixture's overlay. Run from ui/ with node 22+.
#
# Asserts: file override, folder replace, added route, disabled route, the drift lock in --strict
# mode, the runtime/ drop-ins and the drift lock on a replaced runtime file, and that a conflicting
# svelte cannot reach a build.
set -eu

UI=$(cd "$(dirname "$0")/.." && pwd)
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

fail () { echo "FAIL: $*" >&2; exit 1; }

npm pack --pack-destination "$WORK" --silent >/dev/null
TARBALL=$(ls "$WORK"/reqquest-ui-*.tgz)
cp -R "$UI/test-fixture" "$WORK/app"
cd "$WORK/app"
npm install --no-audit --no-fund --silent "$TARBALL"

BASE=node_modules/@reqquest/ui/app/src/routes
[ -d "$BASE/roles/users" ] || fail "fixture expects a base route roles/users to disable"

# a faithful override: the base page plus a marker, generated so it never goes stale against the base
mkdir -p src/routes/requests
sed 's#</script>#</script>\n<p>FIXTURE-OVERRIDE</p>#' "$BASE/requests/+page.svelte" > src/routes/requests/+page.svelte
npx reqquest-ui sync
[ -f reqquest-overrides.lock.json ] || fail "sync did not write the overrides lockfile"

npx reqquest-ui build
grep -rqF FIXTURE-OVERRIDE build/_app || fail "override of requests/+page.svelte not in the build"
grep -rqF FIXTURE-ADDED-ROUTE build/_app || fail "added route reports/ not in the build"
grep -rqF FIXTURE-REPLACED-FOLDER build/_app || fail "replaced announcement/ page not in the build"
[ ! -e .reqquest/src/routes/announcement/+page.ts ] || fail "folder replace kept the base +page.ts"
[ ! -e .reqquest/src/routes/roles/users ] || fail "disabled route roles/users still present"
[ -f build-runtime/nginx.conf ] && [ -f build-runtime/apply-env.sh ] || fail "runtime files missing from build-runtime/"
[ -f build-runtime/nginx/server.d/fixture.conf ] || fail "runtime/nginx/server.d drop-in not in build-runtime/"
[ -f build-runtime/apply-env.d/10-fixture.sh ] || fail "runtime/apply-env.d hook not in build-runtime/"
[ -d build-runtime/nginx/http.d ] || fail "build-runtime/nginx/http.d must exist even when empty, so a Dockerfile can COPY it"
cmp -s build-runtime/nginx.conf node_modules/@reqquest/ui/app/runtime/nginx.conf || fail "nginx.conf is not ReqQuest's although the fixture does not replace it"

# a replaced runtime file is a fork, locked like a route override
RUNTIME_BASE=node_modules/@reqquest/ui/app/runtime
cp "$RUNTIME_BASE/nginx.conf" runtime/nginx.conf
echo '# FIXTURE-REPLACED-NGINX' >> runtime/nginx.conf
if npx reqquest-ui sync --strict 2>/dev/null; then fail "sync --strict accepted an unrecorded runtime/nginx.conf replacement"; fi
npx reqquest-ui sync >/dev/null
grep -q '"runtime"' reqquest-overrides.lock.json || fail "replaced runtime/nginx.conf not recorded in the lockfile"
chmod u+w "$RUNTIME_BASE/nginx.conf"
echo '# simulated upstream change' >> "$RUNTIME_BASE/nginx.conf"
if npx reqquest-ui sync --strict 2>/dev/null; then fail "sync --strict accepted a drifted runtime/nginx.conf"; fi
npx reqquest-ui sync --accept >/dev/null
npx reqquest-ui sync --strict >/dev/null || fail "sync --strict still failing after --accept of runtime/nginx.conf"
rm runtime/nginx.conf
npx reqquest-ui sync >/dev/null

# a file runtime/ does not recognize would never reach the image, so it must not pass quietly
touch runtime/ngnix.conf
if npx reqquest-ui sync 2>/dev/null; then fail "sync accepted an unrecognized file in runtime/"; fi
rm runtime/ngnix.conf

chmod u+w "$BASE/requests/+page.svelte"
echo '<!-- simulated upstream change -->' >> "$BASE/requests/+page.svelte"
if npx reqquest-ui sync --strict 2>/dev/null; then fail "sync --strict accepted a drifted override"; fi
npx reqquest-ui sync --accept >/dev/null
npx reqquest-ui sync --strict >/dev/null || fail "sync --strict still failing after --accept"

# npm only WARNS when the project itself declares a svelte that conflicts with the exact peer pin, and
# installs it anyway - so the version guard in sync is what actually stops the drift
npm install --no-audit --no-fund --silent svelte@5.0.0 2>/dev/null
if npx reqquest-ui sync 2>/dev/null; then fail "sync accepted svelte 5.0.0 over @reqquest/ui's pinned version"; fi

echo "overlay fixture: all assertions passed"
