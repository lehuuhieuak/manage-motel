#!/usr/bin/env bash
set -Eeuo pipefail

usage() {
  cat <<'EOF'
Usage: bash scripts/build.sh [Release|Debug]

Build all .NET applications, Metering, Payment, and the React frontend.
The default .NET configuration is Release. Dependencies are restored as needed;
frontend dependencies are installed from package-lock.json using npm ci.
EOF
}

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  usage
  exit 0
fi

configuration="${1:-Release}"
if (( $# > 1 )) || [[ "$configuration" != "Release" && "$configuration" != "Debug" ]]; then
  usage >&2
  exit 2
fi

repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
step="Checking prerequisites"
trap 'status=$?; printf "\nBuild failed during: %s (exit %s)\n" "$step" "$status" >&2; exit "$status"' ERR

for tool in dotnet go node npm; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    printf 'Required tool is missing from PATH: %s\n' "$tool" >&2
    exit 127
  fi
done

for file in \
  src/ManageMotel.AppHost/AppHost.slnx \
  src/services/Metering/go.mod \
  src/services/Metering/go.sum \
  src/services/Payment/go.mod \
  src/services/Payment/go.sum \
  src/frontend/package.json \
  src/frontend/package-lock.json; do
  if [[ ! -f "$repo_root/$file" ]]; then
    printf 'Required build input is missing: %s\n' "$file" >&2
    exit 1
  fi
done

cd -- "$repo_root"

step="Building .NET applications ($configuration)"
printf '\n==> %s\n' "$step"
# This solution includes AppHost, Gateway, ServiceDefaults, and all .NET services.
dotnet build src/ManageMotel.AppHost/AppHost.slnx \
  --configuration "$configuration" --nologo

step="Reading Go output configuration"
go_exe="$(go env GOEXE)"
go_output="$repo_root/artifacts/go"
mkdir -p -- "$go_output"

for service in metering payment; do
  case "$service" in
    metering) module_directory="Metering" ;;
    payment) module_directory="Payment" ;;
  esac

  step="Building Go service: $service"
  printf '\n==> %s\n' "$step"
  cd -- "$repo_root/src/services/$module_directory"
  go build -mod=readonly -o "$go_output/$service$go_exe" "./cmd/$service"
done

cd -- "$repo_root/src/frontend"
step="Installing frontend dependencies"
printf '\n==> %s\n' "$step"
npm ci --include=dev --no-audit --no-fund

step="Building frontend"
printf '\n==> %s\n' "$step"
npm run build

printf '\nBuild completed successfully (%s).\n' "$configuration"
printf '.NET outputs: project bin/%s/<target-framework>/ directories\n' "$configuration"
printf 'Go outputs:   artifacts/go/\n'
printf 'Frontend:     src/frontend/dist/\n'
