#!/bin/sh
cd /usr/share/nginx/html
ALL_PUBLIC_VARS=$(printf '${%s} ' $(env | cut -d'=' -f1 | grep -E '^PUBLIC_'))
grep --line-buffered -Rl . -e '$PUBLIC_' | while read line; do
  envsubst "$ALL_PUBLIC_VARS" < $line > $line.tmp
  mv $line.tmp $line
  brotli -f $line
  gzip -fk $line
done

if [ -n "$PUBLIC_API_BASE" ]; then
  printf 'location = /help/applicant-guide.md { return 302 %s/help/applicant-guide.md; }\n' "${PUBLIC_API_BASE%/}" > /etc/nginx/reqquest-help.conf
fi
# A downstream project's runtime/apply-env.d. Run rather than sourced so a hook's exit or cd cannot
# cut this script short, and a failure stops the container instead of starting it half-configured.
for hook in /apply-env.d/*.sh; do
  [ -f "$hook" ] || continue
  sh "$hook" || { echo "apply-env: $hook failed" >&2; exit 1; }
done
exit 0
