
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

const DEFAULT_RULES = {
    initialScore: 500,
    maxScore: 1000,
    minScore: 0,
    creditorCreation: 2,
    paymentBonus: {
        early: 4,
        onTime: 3,
        lateTolerance: 1,
    },
    debtorBonus: {
        early: 10,
        onTime: 7,
        lateTolerance: 3,
    },
    penalties: {
        late1to2: -10,
        late3to7: -25,
        late8to30: -70,
        late30plus: -140,
        overdueWeekly: -10,
        overdueMax: -80,
        default: -300,
    }
};

function normalizeDate(d) {
    const n = new Date(d);
    n.setHours(0, 0, 0, 0);
    return n;
}

function applyValueWeight(points, amount) {
    if (amount < 10) return points * 0.20;
    if (amount < 50) return points * 0.60;
    return points;
}

async function main() {
    try {
        const username = 'luis_henrique';
        const usersSnapshot = await db.collection('users').where('username', '==', username).get();

        if (usersSnapshot.empty) return;

        const userDoc = usersSnapshot.docs[0];
        const user = { id: userDoc.id, ...userDoc.data() };
        const userId = user.id;

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

        let score = DEFAULT_RULES.initialScore;
        let earned = 0;
        let lost = 0;
        let history = [];

        const userDebts = allDebts.filter(
            (d) => (d.creditorId === userId || d.debtorId === userId) && !d.wasPartialPayment
        );

        const pairMonthCounts = {};
        userDebts.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        for (const debt of userDebts) {
            let debtPoints = 0;
            let reasons = [];

            const isCreditor = debt.creditorId === userId;
            const isDebtor = debt.debtorId === userId;

            const otherId = isCreditor ? debt.debtorId : debt.creditorId;
            const dbDate = new Date(debt.createdAt);
            const monthKey = `${isCreditor ? userId : otherId}-${isCreditor ? otherId : userId}-${dbDate.getFullYear()}-${dbDate.getMonth()}`;

            if (!pairMonthCounts[monthKey]) pairMonthCounts[monthKey] = 0;
            pairMonthCounts[monthKey]++;
            const isSpam = pairMonthCounts[monthKey] >= 4;

            if (isCreditor) {
                let creationPoints = DEFAULT_RULES.creditorCreation;
                if (isSpam) creationPoints *= 0.5;
                creationPoints = applyValueWeight(creationPoints, debt.originalAmount || debt.amount);
                debtPoints += creationPoints;
                reasons.push(`Credor: Criou dívida (+${creationPoints.toFixed(2)})`);

                if (debt.status === 'PAID' && debt.updatedAt) {
                    let paymentBonus = 0;
                    const payDate = new Date(debt.updatedAt);
                    const dueDate = new Date(debt.dueDate);
                    const normPay = normalizeDate(payDate);
                    const normDue = normalizeDate(dueDate);
                    const dayDiff = Math.floor((normPay.getTime() - normDue.getTime()) / (1000 * 3600 * 24));

                    if (dayDiff < 0) paymentBonus = DEFAULT_RULES.paymentBonus.early;
                    else if (dayDiff === 0) paymentBonus = DEFAULT_RULES.paymentBonus.onTime;
                    else if (dayDiff <= 2) paymentBonus = DEFAULT_RULES.paymentBonus.lateTolerance;

                    if (isSpam) paymentBonus *= 0.5;
                    paymentBonus = applyValueWeight(paymentBonus, debt.originalAmount || debt.amount);
                    debtPoints += paymentBonus;
                    if (paymentBonus > 0) reasons.push(`Credor: Recebeu pagamento (+${paymentBonus.toFixed(2)})`);
                }
            }

            if (isDebtor) {
                const amount = debt.originalAmount || debt.amount;
                if (debt.status === 'PAID' && debt.updatedAt) {
                    let flowPoints = 0;
                    const payDate = new Date(debt.updatedAt);
                    const dueDate = new Date(debt.dueDate);
                    const normPay = normalizeDate(payDate);
                    const normDue = normalizeDate(dueDate);
                    const dayDiff = Math.floor((normPay.getTime() - normDue.getTime()) / (1000 * 3600 * 24));

                    if (dayDiff < 0) flowPoints = DEFAULT_RULES.debtorBonus.early;
                    else if (dayDiff === 0) flowPoints = DEFAULT_RULES.debtorBonus.onTime;
                    else if (dayDiff >= 1 && dayDiff <= 2) flowPoints = DEFAULT_RULES.penalties.late1to2;
                    else if (dayDiff <= 7) flowPoints = DEFAULT_RULES.penalties.late3to7;
                    else if (dayDiff <= 30) flowPoints = DEFAULT_RULES.penalties.late8to30;
                    else flowPoints = DEFAULT_RULES.penalties.late30plus;

                    flowPoints = applyValueWeight(flowPoints, amount);
                    if (flowPoints > 0 && isSpam) flowPoints *= 0.5;
                    debtPoints += flowPoints;
                    reasons.push(`Devedor: Pagou dívida (${flowPoints > 0 ? '+' : ''}${flowPoints.toFixed(2)})`);
                } else if (debt.status === 'OPEN') {
                    const dueDate = new Date(debt.dueDate);
                    const now = new Date();
                    const normDue = normalizeDate(dueDate);
                    const normNow = normalizeDate(now);

                    if (normNow > normDue) {
                        const dayDiff = Math.floor((normNow.getTime() - normDue.getTime()) / (1000 * 3600 * 24));
                        const weeks = Math.floor(dayDiff / 7);
                        let overduePenalty = 0;
                        if (weeks > 0) overduePenalty = weeks * DEFAULT_RULES.penalties.overdueWeekly;
                        if (overduePenalty < DEFAULT_RULES.penalties.overdueMax) overduePenalty = DEFAULT_RULES.penalties.overdueMax;
                        if (dayDiff > 60) overduePenalty = DEFAULT_RULES.penalties.default;

                        overduePenalty = applyValueWeight(overduePenalty, amount);
                        debtPoints += overduePenalty;
                        reasons.push(`Devedor: Dívida vencida (${overduePenalty.toFixed(2)})`);
                    }
                }
            }

            if (debtPoints > 20) debtPoints = 20;
            if (debtPoints > 0) earned += debtPoints;
            else lost += debtPoints;

            history.push({
                debtId: debt.id,
                amount: debt.amount,
                points: debtPoints,
                reasons: reasons
            });
        }

        const finalScore = Math.max(0, Math.min(1000, Math.round(DEFAULT_RULES.initialScore + earned + lost)));

        console.log('FINAL_REPORT:', JSON.stringify({
            user: { name: user.name, username: user.username },
            score: finalScore,
            earned: Math.round(earned),
            lost: Math.round(lost),
            history: history.filter(h => h.points !== 0)
        }));

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
