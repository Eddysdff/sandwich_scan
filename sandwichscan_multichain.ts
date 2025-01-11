const { SandwichDetector } = require('sandwich-scanner');
const { JsonRpcProvider } = require('ethers');
const readline = require('readline');

// 链配置
const CHAINS = {
  ETH: {
    name: 'Ethereum',
    rpc: 'https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY',
    chainId: 1
  },
  BSC: {
    name: 'BNB Chain',
    rpc: 'https://bsc-dataseed.binance.org',
    chainId: 56
  },
  BASE: {
    name: 'Base',
    rpc: 'https://mainnet.base.org',
    chainId: 8453
  },
  SOL: {
    name: 'Solana',
    rpc: 'https://api.mainnet-beta.solana.com',
    chainId: -1  // Solana 不使用 EVM chainId
  }
};

// 创建命令行交互界面
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 选择链
async function selectChain() {
  return new Promise((resolve) => {
    console.log('\n请选择要检测的链：');
    Object.keys(CHAINS).forEach((key, index) => {
      console.log(`${index + 1}. ${CHAINS[key].name}`);
    });

    rl.question('请输入数字选择链 (1-4): ', (answer) => {
      const chainKeys = Object.keys(CHAINS);
      const selection = chainKeys[parseInt(answer) - 1];
      resolve(CHAINS[selection]);
    });
  });
}

// 选择检测方式
async function selectDetectionMethod() {
  return new Promise((resolve) => {
    console.log('\n请选择检测方式：');
    console.log('1. 通过钱包地址检测');
    console.log('2. 通过交易哈希检测');

    rl.question('请输入数字选择检测方式 (1-2): ', (answer) => {
      resolve(parseInt(answer));
    });
  });
}

// 检测钱包地址
async function checkWalletAddress(provider, address) {
  const sandwichDetector = new SandwichDetector(provider);
  try {
    const sandwiches = await sandwichDetector.getSwandwichesforAddressWithOffset(
      address,
      1,
      "UniswapV2"
    );
    
    console.log('\n检测结果：');
    if (sandwiches.length > 0) {
      console.log(`发现 ${sandwiches.length} 次夹子攻击！`);
      sandwiches.forEach((sandwich, index) => {
        console.log(`\n攻击 #${index + 1}:`);
        console.log(`前置交易: ${sandwich.frontRun.hash}`);
        console.log(`受害交易: ${sandwich.sandwich.hash}`);
        console.log(`后置交易: ${sandwich.backRun.hash}`);
      });
    } else {
      console.log('未检测到夹子攻击。');
    }
  } catch (error) {
    console.error('检测过程出错:', error);
  }
}

// 检测交易哈希
async function checkTransactionHash(provider, txHash) {
  const sandwichDetector = new SandwichDetector(provider);
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
    
    console.log('\n检测结果：');
    if (isSandwiched) {
      const sandwich = sandwiches.find(s => 
        s.frontRun.hash === txHash ||
        s.backRun.hash === txHash ||
        s.sandwich.hash === txHash
      );
      console.log('发现夹子攻击！');
      console.log('攻击详情:', sandwich);
    } else {
      console.log('未检测到夹子攻击。');
    }
  } catch (error) {
    console.error('检测过程出错:', error);
  }
}

// 主函数
async function main() {
  try {
    // 1. 选择链
    const selectedChain = await selectChain();
    console.log(`\n已选择: ${selectedChain.name}`);
    
    // 创建 provider
    const provider = new JsonRpcProvider(selectedChain.rpc, {
      chainId: selectedChain.chainId,
      name: selectedChain.name.toLowerCase()
    });

    // 2. 选择检测方式
    const method = await selectDetectionMethod();
    
    // 3. 获取检测参数
    if (method === 1) {
      rl.question('\n请输入钱包地址: ', async (address) => {
        await checkWalletAddress(provider, address);
        rl.close();
      });
    } else {
      rl.question('\n请输入交易哈希: ', async (txHash) => {
        await checkTransactionHash(provider, txHash);
        rl.close();
      });
    }
  } catch (error) {
    console.error('程序执行错误:', error);
    rl.close();
  }
}

// 运行程序
main();
