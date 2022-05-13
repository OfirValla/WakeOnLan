import { initializeApp, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import schedule from 'node-schedule';
import * as wol from 'wol';
import ping from 'ping';

const serviceAccount = {
    "type": "service_account",
    "project_id": process.env.PROJECT_ID,
    "private_key_id": process.env.PRIVATE_KEY_ID,
    "private_key": process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
    "client_email": process.env.CLIENT_EMAIL,
    "client_id": process.env.CLIENT_ID,
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": process.env.CLIENT_X509_CERT_URL
}
const app = initializeApp({
    credential: cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = getDatabase(app);
db.ref('wake-on-lan').on('value', (snapshot) => {
    const changes = snapshot.val();
    if (!changes) return;

    for (const computerName of Object.keys(changes)) {
        const macAddress = changes[computerName].replaceAll('-', ':');
        console.log(`Sending wake-on-lan: ${computerName} - ${macAddress}`);
        
        wol.wake(macAddress, (err, res) => {
            console.log(`res: ${JSON.stringify(res)}`)
            console.log(`err: ${JSON.stringify(err)}`)
        });

        // Remove the keys after waking on lan the computers
        db.ref(`wake-on-lan/${computerName}`).remove()
    }
});

// Update the hosts lists
const hosts = [];
db.ref('computers').on('value', (snapshot) => {
    const changes = snapshot.val();
    for (const computerName of Object.keys(changes)) {
        if (hosts.includes(computerName)) continue;

        hosts.push(computerName);
    }
});

// Check the status of the computers at the start of each minute
const isWindows = process.platform === "win32";
schedule.scheduleJob('0 * * * * *', async (fireDate) => {
    console.log(fireDate);
    for (const host of hosts) {
        let res = await ping.promise.probe(host, {
            timeout: 10,
            extra: isWindows ? ['-n', '1'] : ['-c', '1'],
        });
        console.log(`${host}: ${res.alive}`);
        db.ref(`computers/${host}/isOnline`).set(res.alive);
    }
});