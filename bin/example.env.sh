cp .example.env .env.development
sed -i.bak 's|^DB_ID_NAMESPACE = .*|DB_ID_NAMESPACE = X|' .env.development && rm .env.development.bak
cp .example.env .env.test
sed -i.bak -E 's|^DATABASE_URL = (.*)$|DATABASE_URL = \1\_test|' .env.test && rm .env.test.bak