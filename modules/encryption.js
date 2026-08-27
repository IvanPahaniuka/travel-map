const IV_LENGTH = 12;

async function encrypt(/** @type {Uint8Array<ArrayBuffer>} */ data, /** @type {string} */ encryptionKey) {
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const keyData = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(encryptionKey));
    const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'AES-GCM' },
        false,
        ['encrypt'],
    );
    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        data,
    );
    const encryptedData = new Uint8Array(IV_LENGTH + ciphertext.byteLength);
    encryptedData.set(iv);
    encryptedData.set(new Uint8Array(ciphertext), IV_LENGTH);

    return encryptedData;
}

async function decrypt(/** @type {Uint8Array<ArrayBuffer>} */ encryptedData, /** @type {string} */ encryptionKey) {
    const iv = encryptedData.slice(0, IV_LENGTH);
    const ciphertext = encryptedData.slice(IV_LENGTH);
    const keyData = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(encryptionKey));
    const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'AES-GCM' },
        false,
        ['decrypt'],
    );
    const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext,
    );

    return decryptedData;
}

const Encryption = {
    encrypt,
    decrypt,
};

export default Encryption;