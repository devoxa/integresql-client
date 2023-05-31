#!/bin/sh
set -e

PROJECT="integresql_client"

echo "-> Shutting down previous containers..."
docker ps -a -q --filter "name=${PROJECT}_" | xargs -r docker rm -f

echo ""
echo "-> Checking ports..."
if lsof -Pi :5432 -sTCP:LISTEN -t >/dev/null ; then echo "\n/!\ Something is already listening on port '5432'!" && exit 1; fi
if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null ; then echo "\n/!\ Something is already listening on port '5000'!" && exit 1; fi

echo ""
echo "-> Starting PostgreSQL..."
docker run --rm -d --name "${PROJECT}_postgres" -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:15 \
  postgres -c 'fsync=off' -c 'synchronous_commit=off' -c 'full_page_writes=off'

echo ""
echo "-> Starting IntegreSQL..."
docker run --rm -d --name genesis_integresql -e INTEGRESQL_PGPASSWORD=postgres --network host allaboutapps/integresql

echo ""
echo "-> Generating Prisma client..."
yarn prisma generate

echo ""
echo "-> Duplicating integration tests..."
for i in $(seq 1 10);
do
  cp tests-integration/user.spec.ts tests-integration/user-$i.spec.ts
done

echo ""
echo "-> Running integration tests (cold)..."
rm -f integration-test.log
yarn jest tests-integration/ 2>&1 | tee integration-test.log

echo ""
echo "-> Checking migration behaviour (cold)..."
MIGRATION_COUNT=$(cat integration-test.log | grep "Migrating template database" | wc -l)
if [ "$MIGRATION_COUNT" != "1" ]; then echo "\n/!\ Migrations for template database did not run 1 time!" && exit 1; fi

echo ""
echo "-> Running integration tests (warm)..."
rm -f integration-test.log
yarn jest tests-integration/ 2>&1 | tee integration-test.log

echo ""
echo "-> Checking migration behaviour (warm)..."
MIGRATION_COUNT=$(cat integration-test.log | grep "Migrating template database" | wc -l)
if [ "$MIGRATION_COUNT" != "0" ]; then echo "\n/!\ Migrations for template database did not run 0 times!" && exit 1; fi
