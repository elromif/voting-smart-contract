import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import { vars } from "hardhat/config";

const API_KEY = vars.get("API_KEY");
const WALLET_PRIVATE_KEY = vars.get("WALLET_PRIVATE_KEY");

const config: HardhatUserConfig = {
  solidity: "0.8.27",
  networks: {
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${API_KEY}`,
      accounts: [WALLET_PRIVATE_KEY],
    },
    arbitrum_sepolia: {
      url: `https://arb-sepolia.g.alchemy.com/v2/${API_KEY}`,
      accounts: [WALLET_PRIVATE_KEY],
    }
  },
  etherscan: {
    apiKey: {
      arbitrumSepolia: "R9Z51TY1F8Q68AJRNGPIAQTB8CXYGBDQ76"
    },
    customChains: [
      {
        network: "arbitrumSepolia",
        chainId: 421614,
        urls: {
          apiURL: "https://api-sepolia.arbiscan.io/api",
          browserURL: "https://sepolia.arbiscan.io/"
        }
      }
    ]
  },
};

export default config;
