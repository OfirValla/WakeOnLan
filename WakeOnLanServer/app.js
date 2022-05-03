import { initializeApp, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import * as wol from 'wol';

//import * as fs from 'fs';
// const serviceAccount = JSON.parse(fs.readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT));

const buff = new Buffer(process.env.FIREBASE_SERVICE_ACCOUNT);
const serviceAccount = buff.toString('utf-8');

const app = initializeApp({
    credential: cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = getDatabase(app);
db.ref('wake-on-lan').on('value', (snapshot) => {
    const changes = snapshot.val();
    if (!changes) return;

    for (const computerName of Object.keys(changes)) {
        console.log(`Sending wake-on-lan for: ${computerName}`);
        
        const macAddress = changes[computerName].replaceAll('-', ':');
        wol.wake(macAddress, function (err, res) { });

        // Remove the keys after waking on lan the computers
        db.ref(`wake-on-lan/${computerName}`).remove()
    }
});