export declare const MOON_CONTRACTS: {
    readonly arbitrumNova: "0x0057Ac2d777797d31CD3f8f13bF5e927571D6Ad0";
    readonly arbitrumOne: "0x24404DC041d74cd03cFE28855F555559390C931b";
    readonly ethereum: "0xb2490e357980ce57bf5745e181e537a64eb367b1";
};
export declare const BRIDGE_CONTRACTS: {
    readonly celer: {
        readonly arbitrumOne: "0x1619DE6B6B20eD217a58d00f37B9d47C7663feca";
        readonly arbitrumNova: "0xb3833Ecd19D4Ff964fA7bc3f8aC070ad5e360E56";
        readonly ethereum: "0x5427FEFA711Eff984124bFBB1AB6fbf5E3DA1820";
    };
};
export declare const LIQUIDITY_POOLS: {
    readonly nova: {
        readonly sushiSwapV2: "0xd6c821b282531868721b41badca1f1ce471f43c5";
        readonly rcpSwap: "0x722E8BDD2CE80A4422E880164F2079488E115365";
    };
    readonly one: {
        readonly camelotV3: "0x5e27a422ec06a57567a843fd65a1bbb06ac19fc0";
        readonly uniswapV3: "0x285b461B3d233ab24C665E9FbAF5B96352E3ED07";
        readonly uniswapV4Manager: "0x360E68faCcca8cA495c1B759Fd9EEe466db9FB32";
    };
};
export declare const ERC20_ABI: readonly [{
    readonly constant: true;
    readonly inputs: readonly [{
        readonly name: "_owner";
        readonly type: "address";
    }];
    readonly name: "balanceOf";
    readonly outputs: readonly [{
        readonly name: "balance";
        readonly type: "uint256";
    }];
    readonly type: "function";
}, {
    readonly constant: true;
    readonly inputs: readonly [];
    readonly name: "decimals";
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint8";
    }];
    readonly type: "function";
}, {
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly indexed: true;
        readonly name: "from";
        readonly type: "address";
    }, {
        readonly indexed: true;
        readonly name: "to";
        readonly type: "address";
    }, {
        readonly indexed: false;
        readonly name: "value";
        readonly type: "uint256";
    }];
    readonly name: "Transfer";
    readonly type: "event";
}];
//# sourceMappingURL=addresses.d.ts.map