echo "running eslint..."
./node_modules/.bin/eslint src/
echo "running server-code..."
NODE_ENV=development nodemon --ignore src/main/seeds/ src/main/index.js