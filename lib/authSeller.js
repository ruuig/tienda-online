import { clerkClient } from '@clerk/nextjs/server';

const authSeller = async (userId) => {
  try {
    if (!userId) {
      return false;
    }

    const user = await clerkClient.users.getUser(userId);
    const role = user?.publicMetadata?.role;

    return role === 'seller' || role === 'admin';
  } catch (error) {
    console.error('Error validating seller access:', error);
    return false;
  }
};

export default authSeller;