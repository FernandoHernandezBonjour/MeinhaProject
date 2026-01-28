
const admin = require('firebase-admin');

const firebaseConfig = {
    projectId: "meinha-baf3e",
    clientEmail: "firebase-adminsdk-fbsvc@meinha-baf3e.iam.gserviceaccount.com",
    privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCdfjfbZkfFOHwl\nqqsHP8qwD8yFus9FE6Y9I3icHFMA2FgQrH0Cj9yy0I1bJq0SSLZU5muA59xMVRM1\nKIitPNv1rtgg4WE+W0s2kEeBZaWTx7jozQMXszMExd/h65SwZ/z88wqqUPvZEzyt\nzeRgFkWPPVRwKo+Hx2xMx8Mz9JcbhSfx7xETK5aRvZiwOuiUXjr1v1qwM74p+33q\nBX3Y4aevZgLsdZnSevRqKuO2XuHnkA8eJRTeF+1S9I7rU9gLtHbV7H0tLJruFCEL\n5GcwbZtWoeCmcShU4MecW/j21giYbOa6VVYh6EMhvDs6zKXx5bBC/PTziwwv3wYR\nYdcC3tELAgMBAAECggEAAan9hDTRVjM6lXX3SKRTBFzC0ONZS4Jv3Iye82PAVaZl\nTutY+JCgHhxwqQUAe5OjxDVumctnlAbj3fPrPcXJgoGx+nUuRktHwQy4wumvI4NA\ntViKhESzG4Vbs8S2xz9Dzevxscr80AEDJAEyrr9xDLUPZ1VS5gRdZQQQM+7++4Gp\nTgYa17bfF3McVzyD72bW3HNpwVrKw8BLhaYXKp1+ZjTYXYBSmRTXTRdmK9nPFy19\ncwEwAevNvrLLyTqsY460yoUnUGVrQfYiy8M9aQ4GfepqZry4ADezwdfAXyd0wsDF\nIuo1Gw1LimkaXr+Uxn5fcbVuXbMNfYzj9HZ29gPIQQKBgQDQlnrjKSIK0ucK6ssg\nIGTByR7traIlGEjC5AlVrW3pPbPYG/un8zWJY/ER2UOVl6VDuqM+eHaSQmfOG4h9\n8tmMdtGGeMTNzXDbtiPTx9I/mAQsvudi7PL4Rhp2IvotseXwX1QNysPOuz02A7z8\nFE4hii3ydAQ2AoQYBBYBBkT53wKBgQDBSpVhABQsvGF519oSQqQD8+tbzUsQPerd\nodCkIS9X2/UT7cxks3FQBRAxR0KhuAqakbC0DnMkktCEf9m0y3gy34lcf7fzJgmv\nw+k4bzlERQRyFOKjYCbV/tvN1JRpCUng8mpveWr48ha4szfEifFgrx6CfbAM1be0\nCsIwrLdmVQKBgFzCDnPmXtUhZM1eDGaFAUmL/s0DYg/M9M52ShBnx3Dpl4iLKSZO\n6YfngdTGIV/sx/mOjfnB6DiyfycQ52nbDROB4ztBiYNb0Mxj+xq6yayuFW0wmAVO\nCd6OjkXq2AZqDi8OtXpMqTbN3TKgBvKytOwFXtlq7lR2Wfe0GXTrLNFRAoGBAJyZ\nOHzl+3JjDPYSEvNIWml5bO1rXa1C/M2jE85ltF2SLvR+bGIJn3wdHglOmoU6/hxM\nfMTkEBVJfPZcPp1jW3ab9EWkk/vCjYaBSqoWMmdFI1zp3tROSiiF2r7fw311sQ02\nWVUHIcufFxl82Wm5+H1EY4uFGOTNIZAUR0/4Hn4hAoGAWBMpiuPM0dfMms0ID9SO\nA+7G3RdY6tdzYBu17W3MNwyGjAO3l/i8VRJefO7iypUHZbyW/wO80a0lomVh0/IV\nyHGZLaUcOBokBO+Kd3PyzOKH3DvO15EO6fKO+Coqc9gvs+bAzkDVrOnUvNbhEb82\nJ6VvEBHaoDM40/RrkLmrwsk=\n-----END PRIVATE KEY-----\n".replace(/\\n/g, '\n'),
};

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(firebaseConfig),
    });
}

const db = admin.firestore();

async function main() {
    try {
        const username = 'luis_henrique';
        const usersSnapshot = await db.collection('users').where('username', '==', username).get();

        if (usersSnapshot.empty) {
            console.log(`User ${username} not found`);
            const allUsers = await db.collection('users').get();
            console.log('Available users:', allUsers.docs.map(d => d.data().username));
            return;
        }

        const userDoc = usersSnapshot.docs[0];
        const user = { id: userDoc.id, ...userDoc.data() };
        console.log('USER_DATA:', JSON.stringify(user));

        const debtsSnapshot = await db.collection('debts').get();
        const allDebts = debtsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                dueDate: data.dueDate ? data.dueDate.toDate() : null,
                createdAt: data.createdAt ? data.createdAt.toDate() : null,
                updatedAt: data.updatedAt ? data.updatedAt.toDate() : null,
            };
        });

        const luisDebts = allDebts.filter(d => d.creditorId === user.id || d.debtorId === user.id);
        console.log('LUIS_DEBTS:', JSON.stringify(luisDebts));

        // We also need all debts to calculate the score properly if other users are involved? 
        // Actually the engine takes allDebts.
        console.log('TOTAL_DEBTS_COUNT:', allDebts.length);

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
