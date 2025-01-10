import { SandwichDetector } from 'sandwich-scanner';
import { ethers } from 'ethers';

// Base 链的配置
const BASE_RPC_URL = 'https://mainnet.base.org';  // Base 主网 RPC
const BASE_CHAIN_ID = 8453;                       // Base 链 ID

// 初始化 Base 链的 provider
const provider = new ethers.providers.JsonRpcProvider(
  BASE_RPC_URL,
  BASE_CHAIN_ID
);

// 可选：添加备用 RPC
const backupProviders = [
  new ethers.providers.JsonRpcProvider('https://base.blockpi.network/v1/rpc/public'),
  new ethers.providers.JsonRpcProvider('https://base.meowrpc.com')
];

// 初始化检测器
const sandwichDetector = new SandwichDetector(
  provider,
  undefined,  // Base 链暂时不需要 Covalent API
  backupProviders
);

// 方法1: 检查特定区块的夹子攻击
const checkBlock = async () => {
  const sandwiches = await sandwichDetector.getSandwichesForBlock(
    // Base 链的区块号
    12345678,
    "UniswapV2"  
  );
  console.log('Base链上检测到的夹子攻击:', sandwiches);
}

// 方法2: 检查特定地址是否遭受夹子攻击
const checkAddress = async () => {
  // 使用offset=1更高效，只检查相邻交易
  const sandwiches = await sandwichDetector.getSwandwichesforAddressWithOffset(
    "0x...",     // 要监控的地址
    1,           // offset
    "UniswapV2"  // DEX名称
  );
  console.log('该地址遭受的夹子攻击:', sandwiches);
}
