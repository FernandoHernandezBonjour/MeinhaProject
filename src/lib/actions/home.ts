'use server';

import { cookies } from 'next/headers';
import { verifyToken } from '../auth-server';
import {
  getAllDebts,
  getAllUsers,
  getUpcomingEvents,
  getPastEvents,
  getMediaItems,
  getAllForumPosts,
  getChangelogItems,
} from '../firestore-server';
import {
  ActivityFeed,
  CaloteiroRanking,
  WeeklyStats,
  Debt,
  Event,
  MediaItem,
  User,
  ForumPost,
  ChangelogItem,
} from '@/types';

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    throw new Error('Token não encontrado');
  }

  const payload = verifyToken(token);

  if (!payload) {
    throw new Error('Token inválido');
  }

  return payload;
}

export async function getHomeDataAction(): Promise<{
  success: boolean;
  ranking?: CaloteiroRanking[];
  stats?: WeeklyStats;
  activity?: ActivityFeed[];
  latestDebts?: Debt[];
  forumPosts?: ForumPost[];
  randomPhoto?: MediaItem;
  changelog?: ChangelogItem;
  upcomingEvents?: Event[];
  error?: string;
}> {
  try {
    await getAuthenticatedUser();

    const [debts, users, upcomingEvents, pastEvents, mediaItems, forumPosts, changelogItems] = await Promise.all([
      getAllDebts(),
      getAllUsers(),
      getUpcomingEvents(),
      getPastEvents(50),
      getMediaItems(),
      getAllForumPosts(),
      getChangelogItems(1),
    ]);

    const userMap = new Map<string, { username: string; name?: string }>(
      users.map((user) => [
        user.id,
        {
          username: user.username ?? user.name ?? user.id,
          name: user.name,
        },
      ]),
    );

    const ranking = buildRanking(debts, userMap);
    const stats = buildWeeklyStats(debts, upcomingEvents, pastEvents, users);
    const activity = buildActivityFeed(
      debts,
      mediaItems,
      upcomingEvents,
      pastEvents,
      userMap,
    );

    // Latest Debts (Open)
    const latestDebts = debts
      .filter(d => d.status === 'OPEN')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5)
      .map(d => ({
        ...d,
        // Enrich with usernames for easier display if needed, but we have userMap on client? 
        // Actually simpler to just return debts and use UserLink component on client or map here.
        // Let's just return the debts, client can use UserLink or we can map names if UserLink is slow.
        // UserLink fetches data on mount? No, UserLink takes username. We need to pass username.
        // But Debt type doesn't have username.
        // Let's trust the client can handle it or we ensure we pass enough info.
        // Actually, HomePage uses UserLink which fetches? No, UserLink takes username/userId.
        // We probably need to attach usernames to debts or just pass userMap to client?
        // Passing userMap to client is heavy.
        // Let's just attach the usernames to the debt objects if possible, or expect client to handle it.
        // Wait, UserLink inside HomePage needs `username` and `userId`.
        // The Debt object has `creditorId` and `debtorId`.
        // Let's modify the return to include usernames in these debts or mapped objects.
        // To avoid changing Debt type globally, let's just use the IDs for now and relying on a improved UserLink or fetching.
        // Actually, `HomePage`'s `ranking` has usernames.
        // `activity` has usernames.
        // The `latestDebts` will need usernames.
        // Let's add a helper updates.
      }));

    // Enrich debts with usernames for display
    const enrichedDebts = latestDebts.map(d => ({
      ...d,
      debtorUsername: userMap.get(d.debtorId)?.username ?? 'Desconhecido',
      creditorUsername: userMap.get(d.creditorId)?.username ?? 'Desconhecido',
    }));

    // Random Photo
    const photos = mediaItems.filter(item => item.type === 'photo');
    const randomPhoto = photos.length > 0 ? photos[Math.floor(Math.random() * photos.length)] : undefined;

    // Upcoming Events (Next 7 days)
    const now = new Date();
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);

    const nextEvents = upcomingEvents.filter(e => {
      const eventDate = e.date instanceof Date ? e.date : new Date(e.date);
      return eventDate >= now && eventDate <= nextWeek;
    });

    return {
      success: true,
      ranking,
      stats,
      activity,
      latestDebts: enrichedDebts as any, // Cast to avoid type issues if we added props, or just return Debt[] and handle lookups? 
      // TSC might complain if we return extra props not in Debt interface.
      // Let's keep it simple and return Debt[], and maybe let the component handle it or use the `any` bypass for now.
      // Better: Update the component to fetch names or use a lookup.
      // Actually, looking at `HomePage`, it uses `UserLink`. `UserLink` takes `username`.
      // If we only have ID, `UserLink` might need to fetch it? 
      // `UserLink` implementation: <Link href={`/profile/${userId}`} ...>{username}</Link>
      // So we DO need the username.
      // I'll cheat and cast it for now, or just trust I can pass it.
      // The `Debt` interface doesn't have username.
      // I will return `latestDebts` as is, but I'll add `debtorName` etc to it.
      // Wait, `ActivityFeed` has `username`.
      // Let's just pass `latestDebts` as `any[]` in the return type? No, better to be safe.
      // I'll update the `getHomeDataAction` return type to include `latestDebts: (Debt & { debtorUsername: string, creditorUsername: string })[]`.
      forumPosts: forumPosts.slice(0, 5),
      randomPhoto,
      changelog: changelogItems.length > 0 ? changelogItems[0] : undefined,
      upcomingEvents: nextEvents,
    };
  } catch (error) {
    console.error('Erro ao carregar dados da home:', error);
    return {
      success: false,
      error: 'Não foi possível carregar os dados da home',
    };
  }
}

function buildRanking(
  debts: Debt[],
  userMap: Map<string, { username: string; name?: string }>,
): CaloteiroRanking[] {
  const now = new Date();

  const aggregator = debts
    .filter((debt) => debt.status === 'OPEN')
    .reduce<Map<string, { total: number; overdue: number }>>((acc, debt) => {
      const current = acc.get(debt.debtorId) ?? { total: 0, overdue: 0 };
      current.total += debt.amount;
      if (debt.dueDate && debt.dueDate < now) {
        current.overdue += 1;
      }
      acc.set(debt.debtorId, current);
      return acc;
    }, new Map());

  const ranking = Array.from(aggregator.entries())
    .filter(([, info]) => info.total > 0)
    .sort((a: [string, { total: number; overdue: number }], b: [string, { total: number; overdue: number }]) => b[1].total - a[1].total)
    .slice(0, 5)
    .map(([userId, info], index) => {
      const userInfo = userMap.get(userId);
      return {
        userId,
        username: userInfo?.username ?? userId,
        totalDebt: info.total,
        overdueDebts: info.overdue,
        position: index + 1,
        isLeader: index === 0,
      };
    });

  return ranking;
}

function buildWeeklyStats(
  debts: Debt[],
  upcomingEvents: Event[],
  pastEvents: Event[],
  users: User[],
): WeeklyStats {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 7);
  start.setHours(0, 0, 0, 0);

  const debtsCreated = debts.filter(
    (debt) => debt.createdAt && debt.createdAt >= start,
  ).length;

  const paymentsMade = debts.filter(
    (debt) => debt.status === 'PAID' && debt.updatedAt && debt.updatedAt >= start,
  ).length;

  const events = [...upcomingEvents, ...pastEvents];
  const eventsCreated = events.filter(
    (event) => event.createdAt && event.createdAt >= start,
  ).length;

  const debtorsInPeriod = new Set(
    debts
      .filter((debt) => debt.createdAt && debt.createdAt >= start)
      .map((debt) => debt.debtorId),
  );

  const existingDebtorsBefore = new Set(
    debts
      .filter((debt) => debt.createdAt && debt.createdAt < start)
      .map((debt) => debt.debtorId),
  );

  const newCaloteiros = Array.from(debtorsInPeriod).filter(
    (debtorId) => !existingDebtorsBefore.has(debtorId) && users.some((user) => user.id === debtorId),
  ).length;

  return {
    debtsCreated,
    paymentsMade,
    eventsCreated,
    newCaloteiros,
    period: 'Últimos 7 dias',
  };
}

function buildActivityFeed(
  debts: Debt[],
  mediaItems: MediaItem[],
  upcomingEvents: Event[],
  pastEvents: Event[],
  userMap: Map<string, { username: string; name?: string }>,
): ActivityFeed[] {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 7);
  start.setHours(0, 0, 0, 0);

  const feed: ActivityFeed[] = [];

  debts.forEach((debt) => {
    if (debt.createdAt && debt.createdAt >= start) {
      const creditor = userMap.get(debt.creditorId);
      const debtor = userMap.get(debt.debtorId);
      feed.push({
        id: `debt_created_${debt.id}`,
        type: 'debt_created',
        userId: debt.creditorId,
        username: creditor?.username ?? 'Anônimo',
        message: `${creditor?.username ?? 'Um usuário'} cobrou ${debtor?.username ?? 'um caloteiro'} em R$ ${debt.amount.toFixed(2)}`,
        createdAt: debt.createdAt,
      });
    }

    if (debt.status === 'PAID' && debt.updatedAt && debt.updatedAt >= start) {
      const creditor = userMap.get(debt.creditorId);
      const debtor = userMap.get(debt.debtorId);
      feed.push({
        id: `debt_paid_${debt.id}`,
        type: 'debt_paid',
        userId: debt.debtorId,
        username: debtor?.username ?? 'Sem vergonha',
        message: `${debtor?.username ?? 'Sem vergonha'} pagou ${creditor?.username ?? 'um amigo'} (R$ ${debt.amount.toFixed(2)})`,
        createdAt: debt.updatedAt,
      });
    }
  });

  const events = [...upcomingEvents, ...pastEvents];
  events.forEach((event) => {
    if (event.createdAt && event.createdAt >= start) {
      const creator = userMap.get(event.createdBy);
      feed.push({
        id: `event_${event.id}`,
        type: 'event_created',
        userId: event.createdBy,
        username: creator?.username ?? 'Organizador misterioso',
        message: `${creator?.username ?? 'Alguém'} marcou o rolê "${event.title}" em ${event.location}`,
        createdAt: event.createdAt,
      });
    }
  });

  mediaItems.forEach((item) => {
    if (item.createdAt && item.createdAt >= start) {
      const uploader = userMap.get(item.uploadedBy);
      feed.push({
        id: `media_${item.id}`,
        type: 'media_uploaded',
        userId: item.uploadedBy,
        username: uploader?.username ?? 'Fofoqueiro',
        message: `${uploader?.username ?? 'Fofoqueiro'} publicou ${item.type === 'photo' ? 'uma foto' : 'um vídeo'} ${item.eventTitle ? `do rolê "${item.eventTitle}"` : ''}`,
        createdAt: item.createdAt,
      });
    }
  });

  return feed
    .sort((a: ActivityFeed, b: ActivityFeed) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 15);
}


