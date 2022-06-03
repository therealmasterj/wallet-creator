const fs = require("fs");
const core = require("@elrondnetwork/elrond-core-js");
const {Address, Mnemonic} = require("@elrondnetwork/erdjs/out");
const axios = require('axios');

const getAddressShard = async (erdAddress) => {
    const url = `https://api.elrond.com/accounts/${erdAddress}`;
    const res = await axios.get(url);
    return res.data["shard"];
}

const run = async () => {
    while (true) {
        let account = new core.account();
        let mnemonic = account.generateMnemonic();
        let password = "YOUR_PASSWORD";
        const desiredShard = 0;
        let accountIndex = 0;

        let privateKeyHex = account.privateKeyFromMnemonic(mnemonic, false, accountIndex.toString(), "");
        let privateKey = Buffer.from(privateKeyHex, "hex");
        let keyFileObject = account.generateKeyFileFromPrivateKey(privateKey, password);
        let keyFileJson = JSON.stringify(keyFileObject, null, 4);

        const erdAddress = new Address(Buffer.from(account.publicKey)).bech32();
        const shard = await getAddressShard(erdAddress);

        if (desiredShard === shard) {
            fs.writeFileSync(`output/${erdAddress}.json`, keyFileJson);
            fs.writeFileSync(`output/${erdAddress}.txt`, mnemonic);
            fs.writeFileSync(`output/pwd-${erdAddress}.txt`, password);
            fs.writeFileSync(`output/${erdAddress}.pem`, getPemContent(mnemonic));
            const acc = {
                publicAddress: erdAddress,
                shard: shard,
                password: password,
                mnemonic: mnemonic
            };

            console.log(acc);

            break;
        }

    }

};

const getPemContent = (seed) => {
    const mnemonic = Mnemonic.fromString(seed);

    const buff = mnemonic.deriveKey();

    const secretKeyHex = buff.hex();
    const pubKeyHex = buff.generatePublicKey().hex();

    const combinedKeys = Buffer.from(secretKeyHex + pubKeyHex).toString(
        'base64'
    );

    const addressFromPubKey = buff.generatePublicKey().toAddress().bech32();

    const header = `-----BEGIN PRIVATE KEY for ${addressFromPubKey}-----`;
    const footer = `-----END PRIVATE KEY for ${addressFromPubKey}-----`;

    return `${header}\n${combinedKeys.replace(
        /([^\n]{1,64})/g,
        '$1\n'
    )}${footer}`;

};

run()

