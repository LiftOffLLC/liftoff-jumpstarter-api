echo "running eslint..."
./node_modules/.bin/eslint src/
echo "running babel-code..."
NODE_ENV=development nodemon --ignore src/main/seeds/ -r babel-core/register src/main/index.js