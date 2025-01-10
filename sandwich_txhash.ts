const { SandwichDetector } = require('sandwich-scanner');
const { JsonRpcProvider } = require('ethers');

const BASE_RPC_URL = 'https://mainnet.base.org';
const BASE_CHAIN_ID = 8453;

const provider = new JsonRpcProvider(BASE_RPC_URL, {
  chainId: BASE_CHAIN_ID,
  name: 'base'
});

const sandwichDetector = new SandwichDetector(provider);

async function checkTxForSandwich(txHash) {
  try {
    const tx = await provider.getTransaction(txHash);
    if (!tx) throw new Error('交易未找到');
    
    const sandwiches = await sandwichDetector.getSandwichesForBlock(
      tx.blockNumber,
      "UniswapV2"
    );
    
    const isSandwiched = sandwiches.some(sandwich => 
      sandwich.frontRun.hash === txHash ||
      sandwich.backRun.hash === txHash ||
      sandwich.sandwich.hash === txHash
    );
    
    console.log('交易是否遭受夹子攻击:', isSandwiched);
    if (isSandwiched) {
      console.log('攻击详情:', sandwiches.find(s => 
        s.frontRun.hash === txHash ||
        s.backRun.hash === txHash ||
        s.sandwich.hash === txHash
      ));
    }
    
    return isSandwiched;
    
  } catch (error) {
    console.error('检测过程出错:', error);
    return false;
  }
}

// 导出函数
module.exports = { checkTxForSandwich };

// 如果直接运行脚本
if (require.main === module) {
  const txHash = '0x.....'; // 你要检查的交易哈希
  checkTxForSandwich(txHash);
}
