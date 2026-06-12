import { createClerkClient } from "@clerk/backend";

const limit = 500;

function getPrimaryEmailAddress(user) {
  const primaryEmailAddress = user.emailAddresses.find(
    (emailAddress) => emailAddress.id === user.primaryEmailAddressId,
  );

  return primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? null;
}

function toAccessUser(user) {
  return {
    id: user.id,
    emailAddress: getPrimaryEmailAddress(user),
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    freeAccess: user.publicMetadata?.freeAccess === true,
    vipAccess: user.publicMetadata?.vipAccess === true,
  };
}

async function listAccessUsers() {
  if (!process.env.CLERK_SECRET_KEY) {
    throw new Error("CLERK_SECRET_KEY is required to list Clerk users.");
  }

  const client = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  const freeUsers = [];
  const vipUsers = [];
  let offset = 0;
  let totalScanned = 0;

  while (true) {
    const { data, totalCount } = await client.users.getUserList({
      limit,
      offset,
    });

    for (const user of data) {
      const listedUser = toAccessUser(user);

      if (listedUser.freeAccess) {
        freeUsers.push(listedUser);
      }

      if (listedUser.vipAccess) {
        vipUsers.push(listedUser);
      }
    }

    totalScanned += data.length;
    offset += data.length;

    if (offset >= totalCount || data.length === 0) {
      break;
    }
  }

  return {
    totalScanned,
    counts: {
      free: freeUsers.length,
      vip: vipUsers.length,
    },
    freeUsers,
    vipUsers,
  };
}

listAccessUsers()
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
