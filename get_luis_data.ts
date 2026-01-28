
import { getUserByUsername, getAllDebts } from './src/lib/firestore-server';
import { calculateMeinhaScore, DEFAULT_RULES } from './src/lib/score-engine';

async function main() {
    try {
        const username = 'luis_henrique';
        const user = await getUserByUsername(username);

        if (!user) {
            console.log(`User ${username} not found`);
            return;
        }

        console.log('USER_DATA:', JSON.stringify(user));

        const allDebts = await getAllDebts();
        const luisDebts = allDebts.filter(d => d.creditorId === user.id || d.debtorId === user.id);

        console.log('LUIS_DEBTS:', JSON.stringify(luisDebts));

        const scoreDetails = calculateMeinhaScore(user.id, allDebts, DEFAULT_RULES);
        console.log('SCORE_DETAILS:', JSON.stringify(scoreDetails));

        // Detailed breakdown of penalties/bonuses
        const breakdown = luisDebts.map(d => {
            const isDebtor = d.debtorId === user.id;
            const isCreditor = d.creditorId === user.id;
            const status = d.status;
            const amount = d.amount;
            const dueDate = d.dueDate;
            const createdAt = d.createdAt;
            const updatedAt = d.updatedAt;

            return {
                id: d.id,
                isDebtor,
                isCreditor,
                status,
                amount,
                dueDate,
                createdAt,
                updatedAt,
                wasPartialPayment: d.wasPartialPayment
            };
        });
        console.log('BREAKDOWN:', JSON.stringify(breakdown));

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
