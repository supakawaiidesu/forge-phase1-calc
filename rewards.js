const { request, GraphQLClient } = require('graphql-request');
const { stringify } = require('csv-stringify');
const fs = require('fs');

const GRAPHQL_ENDPOINT = 'https://arkiverbackup.moltennetwork.com/graphql';
const QUERY = `
query MyQuery {
  Trades(
    filter: {chainId: 9001, _operators: {timestamp: {gt: 1704326400}}, AND: {_operators: {timestamp: {lt: 1706745600}}}}
    limit: 0
    sort: BLOCKNUMBER_DESC
  ) {
    user
    size
  }
}
`;

const client = new GraphQLClient(GRAPHQL_ENDPOINT);

async function calculateTradeSizes() {
  try {
    const data = await client.request(QUERY);
    const trades = data.Trades;

    const tradeSizesByUser = {};
    for (const trade of trades) {
      const address = trade.user;
      tradeSizesByUser[address] = (tradeSizesByUser[address] || 0) + trade.size;
    }

    // Convert to array of [address, size] pairs for sorting
    const sizeEntries = Object.entries(tradeSizesByUser);

    // Sort in descending order based on size
    sizeEntries.sort((a, b) => b[1] - a[1]); 

    // Prepare CSV data
    const csvData = [['Address', 'Total Size']]; 
    sizeEntries.forEach(([address, size]) => csvData.push([address, size]));

    // Generate CSV string
    stringify(csvData, (err, output) => {
      if (err) throw err;

      // Write the CSV to a file
      fs.writeFile('trade_sizes.csv', output, (err) => {
        if (err) throw err;
        console.log('Trade sizes saved to trade_sizes.csv');
      });
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

calculateTradeSizes();
