import {
    ChainStatic,
    RenNetwork,
    RenNetworkDetails,
    RenNetworkString,
} from "@renproject/interfaces";
import { isHex, randomBytes, utilsWithChainNetwork } from "@renproject/utils";
import base58 from "bs58";

import {
    BtcAddress,
    BtcNetwork,
    BtcTransaction,
    BitcoinClass,
    validateAddress,
} from "@renproject/chains-bitcoin";
import {
    createAddress,
    pubKeyScript,
} from "@renproject/chains-bitcoin/build/main/script";
import { UTXO } from "@renproject/chains-bitcoin/build/main/APIs/API";

export class MockChain extends BitcoinClass {
    public static chain = "MockChain";
    public chain = MockChain.chain;
    public name = MockChain.chain;
    public mempool: (UTXO & { to: string })[];

    constructor(network: BtcNetwork = "testnet") {
        super(network);
        this.mempool = [];
    }

    public fetchUTXO = async (txHash: string, vOut: number): Promise<UTXO> => {
        const utxo = this.mempool.find(
            (x) => x.txHash === txHash && x.vOut === vOut,
        );
        if (utxo) {
            return utxo;
        }
        throw new Error(`UTXO ${txHash}, ${vOut} not found`);
    };
    public fetchUTXOs = async (
        address: string,
        confirmations?: number,
    ): Promise<UTXO[]> => {
        return this.mempool.filter(
            (x) => x.to === address && x.confirmations >= (confirmations || 0),
        );
    };

    public addUTXO = (to: string, amount: number): UTXO => {
        const tx = {
            to,
            txHash: randomBytes(32).toString("hex"),
            vOut: 0,
            amount: amount.toString(),
            confirmations: 0,
        };
        this.mempool.push(tx);
        return tx;
    };

    // APIs
    public withDefaultAPIs = (_network: BtcNetwork): this => {
        return this.withAPI(this);
    };

    public static asset = "BTC";
    public asset = "BTC";
    public static utils = {
        resolveChainNetwork: BitcoinClass.utils.resolveChainNetwork,
        p2shPrefix: {
            mainnet: Buffer.from([0x05]),
            testnet: Buffer.from([0xc4]),
        },
        createAddress: createAddress(base58.encode),
        calculatePubKeyScript: pubKeyScript(),
        addressIsValid: (
            address: BtcAddress | string,
            network:
                | RenNetwork
                | RenNetworkString
                | RenNetworkDetails
                | BtcNetwork = "mainnet",
        ) =>
            validateAddress(
                address,
                MockChain.asset,
                MockChain.utils.resolveChainNetwork(network),
            ),

        transactionIsValid: (
            transaction: BtcTransaction | string,
            _network:
                | RenNetwork
                | RenNetworkString
                | RenNetworkDetails
                | BtcNetwork = "mainnet",
        ) =>
            isHex(
                typeof transaction === "string"
                    ? transaction
                    : transaction.txHash,
                { length: 32 },
            ),

        addressExplorerLink: (
            address: BtcAddress | string,
            _network:
                | RenNetwork
                | RenNetworkString
                | RenNetworkDetails
                | BtcNetwork = "mainnet",
        ): string | undefined => {
            return address;
        },

        transactionExplorerLink: (
            tx: BtcTransaction | string,
            _network:
                | RenNetwork
                | RenNetworkString
                | RenNetworkDetails
                | BtcNetwork = "mainnet",
        ): string | undefined => {
            return typeof tx === "string" ? tx : tx.txHash;
        },
    };

    public utils = utilsWithChainNetwork(
        MockChain.utils,
        () => this.chainNetwork,
    );
}

const _: ChainStatic<BtcTransaction, BtcAddress, BtcNetwork> = MockChain;
